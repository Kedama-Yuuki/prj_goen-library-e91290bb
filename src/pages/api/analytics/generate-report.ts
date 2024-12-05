import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { getLlmModelAndGenerateContent } from '@/utils/functions';
import { supabase } from '@/supabase';

type AnalyticsData = {
  lendingStats: {
    totalLending: number;
    averageDuration: number;
    topGenres: string[];
    monthlyTrends: Array<{
      month: string;
      count: number;
    }>;
  };
  bookStats: {
    totalBooks: number;
    activeBooks: number;
    popularBooks: Array<{
      id: number;
      title: string;
      lendCount: number;
    }>;
  };
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { startDate, endDate } = req.query;

  if (startDate && !isValidDate(startDate as string)) {
    return res.status(400).json({ error: '不正な日付形式です' });
  }
  if (endDate && !isValidDate(endDate as string)) {
    return res.status(400).json({ error: '不正な日付形式です' });
  }

  try {
    let lendingQuery = supabase
      .from('lending_records')
      .select('*');

    if (startDate) {
      lendingQuery = lendingQuery.gte('lending_date', startDate);
    }
    if (endDate) {
      lendingQuery = lendingQuery.lte('lending_date', endDate);
    }

    const { data: lendingData, error: lendingError } = await lendingQuery;

    if (lendingError) {
      if (lendingError.status === 401) {
        return res.status(401).json({ error: '認証に失敗しました' });
      }
      throw lendingError;
    }

    const { data: booksData, error: booksError } = await supabase
      .from('books')
      .select('*');

    if (booksError) {
      throw booksError;
    }

    const analyticsData: AnalyticsData = {
      lendingStats: {
        totalLending: lendingData?.length || 0,
        averageDuration: calculateAverageDuration(lendingData || []),
        topGenres: calculateTopGenres(booksData || []),
        monthlyTrends: generateMonthlyTrends(lendingData || [])
      },
      bookStats: {
        totalBooks: booksData?.length || 0,
        activeBooks: calculateActiveBooks(booksData || []),
        popularBooks: calculatePopularBooks(lendingData || [], booksData || [])
      }
    };

    try {
      const aiAnalysis = await getLlmModelAndGenerateContent(
        'Gemini',
        '蔵書利用データの分析を行い、トレンドや特徴を抽出してください。',
        JSON.stringify(analyticsData)
      );
      analyticsData.lendingStats.topGenres = aiAnalysis.recommendedGenres || analyticsData.lendingStats.topGenres;
    } catch (error) {
      console.error('AI分析でエラーが発生しました:', error);
    }

    return res.status(200).json(analyticsData);

  } catch (error) {
    console.error('Error generating report:', error);
    return res.status(500).json({ error: 'データの取得に失敗しました' });
  }
}

function isValidDate(dateString: string): boolean {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

function calculateAverageDuration(lendingData: any[]): number {
  if (lendingData.length === 0) return 0;
  
  const completedLendings = lendingData.filter(record => record.actual_return_date);
  if (completedLendings.length === 0) return 0;

  const totalDuration = completedLendings.reduce((sum, record) => {
    const lendingDate = new Date(record.lending_date);
    const returnDate = new Date(record.actual_return_date);
    const duration = Math.ceil((returnDate.getTime() - lendingDate.getTime()) / (1000 * 60 * 60 * 24));
    return sum + duration;
  }, 0);

  return Math.round(totalDuration / completedLendings.length);
}

function calculateTopGenres(booksData: any[]): string[] {
  const genreCounts: { [key: string]: number } = {};
  
  booksData.forEach(book => {
    if (book.genre) {
      genreCounts[book.genre] = (genreCounts[book.genre] || 0) + 1;
    }
  });

  return Object.entries(genreCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([genre]) => genre);
}

function generateMonthlyTrends(lendingData: any[]): Array<{ month: string; count: number }> {
  const monthlyData: { [key: string]: number } = {};

  lendingData.forEach(record => {
    const month = record.lending_date.substring(0, 7);
    monthlyData[month] = (monthlyData[month] || 0) + 1;
  });

  return Object.entries(monthlyData)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => ({ month, count }));
}

function calculateActiveBooks(booksData: any[]): number {
  return booksData.filter(book => book.status === '利用可能' || book.status === '貸出中').length;
}

function calculatePopularBooks(lendingData: any[], booksData: any[]): Array<{ id: number; title: string; lendCount: number }> {
  const lendingCounts: { [key: string]: number } = {};
  
  lendingData.forEach(record => {
    lendingCounts[record.book_id] = (lendingCounts[record.book_id] || 0) + 1;
  });

  return Object.entries(lendingCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([bookId, count]) => {
      const book = booksData.find(b => b.id === bookId);
      return {
        id: parseInt(bookId),
        title: book?.title || '不明な書籍',
        lendCount: count
      };
    });
}