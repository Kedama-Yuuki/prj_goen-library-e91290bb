import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { getLlmModelAndGenerateContent } from '@/utils/functions';
import axios from 'axios';
import { supabase } from '@/supabase';

type ShippingRequest = {
  lendingRecordId: string;
  carrierId: number;
  recipientName: string;
  recipientAddress: string;
  recipientZipCode: string;
  recipientPhone: string;
  notes?: string;
};

const validateZipCode = (zipCode: string): boolean => {
  return /^\d{3}-\d{4}$/.test(zipCode);
};

const validatePhoneNumber = (phone: string): boolean => {
  return /^\d{2,4}-\d{2,4}-\d{4}$/.test(phone);
};

const validateRequest = (data: ShippingRequest): { isValid: boolean; error?: string } => {
  if (!data.lendingRecordId || !data.carrierId || !data.recipientName || 
      !data.recipientAddress || !data.recipientZipCode || !data.recipientPhone) {
    return { isValid: false, error: '必須パラメータが不足しています' };
  }

  if (!validateZipCode(data.recipientZipCode)) {
    return { isValid: false, error: '不正な郵便番号形式です' };
  }

  if (!validatePhoneNumber(data.recipientPhone)) {
    return { isValid: false, error: '不正な電話番号形式です' };
  }

  return { isValid: true };
};

const arrangeShipping = async (data: ShippingRequest) => {
  try {
    // キャリア在庫確認
    const { data: availability, error: availabilityError } = await supabase
      .from('carrier_availability')
      .select('available')
      .eq('carrier_id', data.carrierId)
      .single();

    if (availabilityError || !availability?.available) {
      throw new Error('配送業者が利用できません');
    }

    // 配送業者APIリクエスト生成
    const carrierApiPrompt = `
      配送依頼情報:
      - 受取人: ${data.recipientName}
      - 住所: ${data.recipientAddress}
      - 郵便番号: ${data.recipientZipCode}
      - 電話番号: ${data.recipientPhone}
      - 備考: ${data.notes || ''}
    `;

    const apiResponse = await getLlmModelAndGenerateContent(
      'Gemini',
      '配送業者APIリクエストの生成',
      carrierApiPrompt
    );

    // 配送記録の保存
    const { data: shippingRecord, error: insertError } = await supabase
      .from('shipping_records')
      .insert({
        lending_record_id: data.lendingRecordId,
        carrier_id: data.carrierId,
        recipient_name: data.recipientName,
        recipient_address: data.recipientAddress,
        recipient_zip_code: data.recipientZipCode,
        recipient_phone: data.recipientPhone,
        notes: data.notes,
        status: 'pending'
      })
      .select()
      .single();

    if (insertError) {
      if (insertError.code === 'unauthorized') {
        throw new Error('認証に失敗しました');
      }
      throw new Error('トランザクションに失敗しました');
    }

    return {
      id: shippingRecord.id,
      trackingNumber: shippingRecord.tracking_number
    };

  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('配送手配に失敗しました');
  }
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const validation = validateRequest(req.body);
    if (!validation.isValid) {
      return res.status(400).json({ error: validation.error });
    }

    const result = await arrangeShipping(req.body);
    return res.status(200).json(result);

  } catch (error) {
    if (error instanceof Error) {
      if (error.message === '認証に失敗しました') {
        return res.status(401).json({ error: error.message });
      }
      if (error.message === '必須パラメータが不足しています' || 
          error.message === '不正な郵便番号形式です' ||
          error.message === '不正な電話番号形式です') {
        return res.status(400).json({ error: error.message });
      }
    }
    return res.status(500).json({ error: '配送手配に失敗しました' });
  }
}