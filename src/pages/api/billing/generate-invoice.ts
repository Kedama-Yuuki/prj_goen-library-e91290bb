import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/supabase';
import PDFDocument from 'pdfkit';
import nodemailer from 'nodemailer';
import dayjs from 'dayjs';

interface BillingData {
  company_id: string;
  usage_fee: number;
  shipping_fee: number;
  total_books: number;
}

interface GeneratedInvoice {
  invoiceNumber: string;
  companyId: string;
  billingMonth: string;
  totalAmount: number;
  details: {
    利用料: number;
    配送料: number;
  };
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { billingMonth } = req.body;

  if (!dayjs(billingMonth, 'YYYY-MM', true).isValid()) {
    return res.status(400).json({ error: '請求対象月の形式が不正です' });
  }

  try {
    const startDate = dayjs(billingMonth).startOf('month').toISOString();
    const endDate = dayjs(billingMonth).endOf('month').toISOString();

    const { data: billingData, error } = await supabase
      .from('lending_records')
      .select(`
        company_id,
        lending_date,
        books!inner(lending_conditions)
      `)
      .between('lending_date', startDate, endDate);

    if (error) {
      throw error;
    }

    const aggregatedData: { [key: string]: BillingData } = {};
    billingData.forEach((record: any) => {
      const companyId = record.company_id;
      if (!aggregatedData[companyId]) {
        aggregatedData[companyId] = {
          company_id: companyId,
          usage_fee: 0,
          shipping_fee: 0,
          total_books: 0,
        };
      }
      const lendingConditions = record.books.lending_conditions;
      aggregatedData[companyId].usage_fee += lendingConditions.fee_per_day;
      aggregatedData[companyId].shipping_fee += 500;
      aggregatedData[companyId].total_books += 1;
    });

    const invoices: GeneratedInvoice[] = [];
    const month = dayjs(billingMonth).format('YYYYMM');

    for (const [index, data] of Object.values(aggregatedData).entries()) {
      const invoiceNumber = `INV-${month}-${String(index + 1).padStart(4, '0')}`;
      const totalAmount = data.usage_fee + data.shipping_fee;

      const invoice: GeneratedInvoice = {
        invoiceNumber,
        companyId: data.company_id,
        billingMonth,
        totalAmount,
        details: {
          利用料: data.usage_fee,
          配送料: data.shipping_fee,
        },
      };

      // PDF生成
      const doc = new PDFDocument();
      let buffer = Buffer.from('');
      doc.on('data', (chunk) => {
        buffer = Buffer.concat([buffer, chunk]);
      });

      doc
        .fontSize(20)
        .text(`請求書 ${invoiceNumber}`, { align: 'center' })
        .moveDown()
        .fontSize(14)
        .text(`請求金額: ¥${totalAmount.toLocaleString()}`)
        .moveDown()
        .text(`利用料: ¥${data.usage_fee.toLocaleString()}`)
        .text(`配送料: ¥${data.shipping_fee.toLocaleString()}`);

      doc.end();

      // データベースに請求書レコードを保存
      const { error: insertError } = await supabase
        .from('billing_records')
        .insert([
          {
            company_id: data.company_id,
            billing_month: billingMonth,
            amount: totalAmount,
            status: '未払い',
            details: {
              利用料: data.usage_fee,
              配送料: data.shipping_fee,
            },
          },
        ]);

      if (insertError) {
        throw insertError;
      }

      // メール送信
      const { data: companyData } = await supabase
        .from('companies')
        .select('contact')
        .eq('id', data.company_id)
        .single();

      await transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: companyData.contact.email,
        subject: `${dayjs(billingMonth).format('YYYY年M月')}分請求書`,
        text: `請求書番号：${invoiceNumber}
請求金額：¥${totalAmount.toLocaleString()}`,
        attachments: [
          {
            filename: `invoice-${invoiceNumber}.pdf`,
            content: buffer,
            contentType: 'application/pdf',
          },
        ],
      });

      invoices.push(invoice);
    }

    return res.status(200).json({
      message: '請求書の生成が完了しました',
      invoices,
    });
  } catch (error) {
    console.error('請求書生成エラー:', error);
    return res.status(500).json({
      error: 'データベースの処理中にエラーが発生しました',
    });
  }
}