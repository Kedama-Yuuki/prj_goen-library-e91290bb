import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/supabase';
import { getLlmModelAndGenerateContent } from '@/utils/functions';

type MatchingResult = {
  id: string;
  companyName: string;
  matchScore: number;
  recommendedBooks: {
    id: string;
    title: string;
    author: string;
  }[];
};

type RequestBody = {
  minScore: number;
  maxResults: number;
  page?: number;
  companyFilter?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { minScore, maxResults, page = 1, companyFilter } = req.body as RequestBody;

    if (minScore < 0 || minScore > 1 || maxResults <= 0) {
      return res.status(400).json({ error: '不正なパラメータです' });
    }

    const { data: lendingRecords, error: lendingError } = await supabase
      .from('lending_records')
      .select(`
        id,
        borrower_id,
        book_id,
        lending_date,
        return_date,
        borrower:companies(id, name),
        book:books(id, title, author)
      `)
      .order('lending_date', { ascending: false });

    if (lendingError) {
      return res.status(500).json({ error: 'データの取得に失敗しました' });
    }

    const systemPrompt = `
      あなたは企業間の蔵書マッチングを行うAIアシスタントです。
      貸出履歴データを分析し、各企業に最適な書籍を推奨してください。
      企業の過去の貸出傾向と書籍のジャンルや内容を考慮して、
      マッチングスコアを0から1の範囲で算出してください。
    `;

    const userPrompt = `
      以下の貸出履歴データを分析し、企業ごとのマッチングスコアと推奨書籍を生成してください：
      ${JSON.stringify(lendingRecords)}
    `;

    let matchingResults: MatchingResult[];

    try {
      const aiResponse = await getLlmModelAndGenerateContent('Gemini', systemPrompt, userPrompt);
      matchingResults = JSON.parse(aiResponse);
    } catch (error) {
      // AIリクエスト失敗時のフォールバック
      matchingResults = generateSampleMatchingResults(lendingRecords);
    }

    if (companyFilter) {
      matchingResults = matchingResults.filter(result => 
        result.companyName.toLowerCase().includes(companyFilter.toLowerCase())
      );
    }

    matchingResults = matchingResults.filter(result => result.matchScore >= minScore);

    const startIndex = (page - 1) * maxResults;
    const endIndex = startIndex + maxResults;
    const paginatedResults = matchingResults.slice(startIndex, endIndex);

    const totalPages = Math.ceil(matchingResults.length / maxResults);

    return res.status(200).json({
      results: paginatedResults,
      currentPage: page,
      totalPages,
      totalResults: matchingResults.length
    });

  } catch (error) {
    return res.status(500).json({ error: '予期せぬエラーが発生しました' });
  }
}

function generateSampleMatchingResults(lendingRecords: any[]): MatchingResult[] {
  const companies = new Map();
  
  lendingRecords.forEach(record => {
    if (!companies.has(record.borrower.id)) {
      companies.set(record.borrower.id, {
        id: record.borrower.id,
        name: record.borrower.name,
        books: new Set()
      });
    }
    companies.get(record.borrower.id).books.add(record.book);
  });

  return Array.from(companies.values()).map(company => ({
    id: company.id,
    companyName: company.name,
    matchScore: 0.8 + Math.random() * 0.2,
    recommendedBooks: Array.from(company.books).slice(0, 3).map((book: any) => ({
      id: book.id,
      title: book.title,
      author: book.author
    }))
  })).sort((a, b) => b.matchScore - a.matchScore);
}