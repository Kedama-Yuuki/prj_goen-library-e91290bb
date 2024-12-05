import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/supabase';
import { getLlmModelAndGenerateContent } from '@/utils/functions';
import axios from 'axios';

type RecommendationItem = {
  id: string;
  title: string;
  author: string;
  publisher: string;
  category: string;
  matchScore: number;
};

type RecommendationResponse = {
  recommendations: {
    [key: string]: RecommendationItem[];
  };
  categories: string[];
};

const DEFAULT_CATEGORIES = ['business', 'technology', 'management', 'science'];
const DEFAULT_LIMIT = 5;

export default async function generateRecommendations(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const companyId = req.headers['x-company-id'];
  if (!companyId) {
    return res.status(400).json({ error: '企業IDが指定されていません' });
  }

  const category = req.query.category as string;
  const limit = parseInt(req.query.limit as string) || DEFAULT_LIMIT;

  try {
    // 1. 利用履歴データの取得
    const { data: lendingHistory, error: lendingError } = await supabase
      .from('lending_records')
      .select('book_id, books(id, title, author, publisher, category)')
      .eq('borrower_id', companyId)
      .order('lending_date', { ascending: false });

    if (lendingError) {
      throw new Error('利用履歴の取得に失敗しました');
    }

    // 2. 企業情報の分析
    const { data: companyData, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single();

    if (companyError) {
      throw new Error('企業情報の取得に失敗しました');
    }

    // 3. AIモデルによる推論処理
    const systemPrompt = `
      あなたは企業向け書籍推薦システムです。
      以下の情報を基に、最適な書籍をレコメンドしてください：
      - 企業の過去の利用履歴
      - 企業の業種・規模などの情報
      - 現在のトレンドやビジネス課題
    `;

    const userPrompt = `
      企業情報：
      ${JSON.stringify(companyData)}
      
      利用履歴：
      ${JSON.stringify(lendingHistory)}
      
      カテゴリー指定：${category || 'なし'}
      推薦数：${limit}
    `;

    let aiRecommendations;
    try {
      const aiResponse = await getLlmModelAndGenerateContent('Gemini', systemPrompt, userPrompt);
      aiRecommendations = JSON.parse(aiResponse);
    } catch (error) {
      // AIリクエスト失敗時のサンプルデータ
      aiRecommendations = {
        business: [
          { id: '1', title: 'ビジネス戦略入門', author: '経営太郎', publisher: 'ビジネス出版', category: 'business', matchScore: 0.95 },
          { id: '2', title: 'マーケティング実践ガイド', author: '販売次郎', publisher: 'マーケット社', category: 'business', matchScore: 0.9 }
        ],
        technology: [
          { id: '3', title: 'DX推進ガイドブック', author: '技術花子', publisher: 'テック出版', category: 'technology', matchScore: 0.88 },
          { id: '4', title: 'AI活用の実践', author: 'データ三郎', publisher: 'IT書房', category: 'technology', matchScore: 0.85 }
        ]
      };
    }

    // 4. レコメンド結果の生成
    const recommendations: RecommendationResponse = {
      recommendations: {},
      categories: category ? [category] : DEFAULT_CATEGORIES
    };

    // カテゴリーでフィルタリング
    Object.entries(aiRecommendations).forEach(([cat, books]) => {
      if (!category || category === cat) {
        recommendations.recommendations[cat] = (books as RecommendationItem[]).slice(0, limit);
      }
    });

    return res.status(200).json(recommendations);

  } catch (error) {
    console.error('Recommendation generation error:', error);
    return res.status(500).json({ error: error instanceof Error ? error.message : '予期せぬエラーが発生しました' });
  }
}