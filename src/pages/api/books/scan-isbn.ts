import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { getLlmModelAndGenerateContent } from '@/utils/functions';
import axios from 'axios';
import { supabase } from '@/supabase';

const ISBN_API_URL = 'https://api.openbd.jp/v1/get';

type BookData = {
  isbn: string;
  title: string;
  author: string;
  publisher: string;
};

const validateISBN = (isbn: string): boolean => {
  const cleanIsbn = isbn.replace(/[-\s]/g, '');
  return /^(?:\d{10}|\d{13})$/.test(cleanIsbn);
};

const fetchBookDataFromOpenBD = async (isbn: string): Promise<BookData | null> => {
  try {
    const response = await axios.get(`${ISBN_API_URL}/${isbn}`);
    const data = response.data[0];
    
    if (!data) {
      return null;
    }

    return {
      isbn: isbn,
      title: data.summary.title,
      author: data.summary.author,
      publisher: data.summary.publisher
    };
  } catch (error) {
    return null;
  }
};

const extractBookDataFromAI = async (isbn: string): Promise<BookData> => {
  const systemPrompt = "書籍情報を抽出し、JSON形式で返してください。";
  const userPrompt = `ISBNコード: ${isbn}から書籍の基本情報を推測してください。`;
  
  try {
    const result = await getLlmModelAndGenerateContent("Gemini", systemPrompt, userPrompt);
    return JSON.parse(result);
  } catch (error) {
    return {
      isbn: isbn,
      title: "不明な書籍",
      author: "不明",
      publisher: "不明"
    };
  }
};

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { barcodeData } = req.body;

  if (!barcodeData) {
    return res.status(400).json({ error: 'Barcode data is required' });
  }

  if (!validateISBN(barcodeData)) {
    return res.status(400).json({ error: 'Invalid ISBN format' });
  }

  try {
    // 既存データの確認
    const { data: existingBook, error: fetchError } = await supabase
      .from('books')
      .select('*')
      .eq('isbn', barcodeData)
      .single();

    if (existingBook) {
      return res.status(200).json(existingBook);
    }

    // OpenBD APIから書籍情報取得
    let bookData = await fetchBookDataFromOpenBD(barcodeData);

    // OpenBD APIで取得できない場合はAIで推測
    if (!bookData) {
      bookData = await extractBookDataFromAI(barcodeData);
    }

    // データベースに保存
    const { data: savedBook, error: saveError } = await supabase
      .from('books')
      .insert([bookData])
      .select()
      .single();

    if (saveError) {
      throw new Error('Failed to save book data');
    }

    return res.status(200).json(savedBook);
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Failed to fetch book data' });
  }
};

export default handler;