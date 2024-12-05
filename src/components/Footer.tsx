import { FaGithub, FaTwitter, FaLinkedin } from 'react-icons/fa';
import Link from 'next/link';

const Footer = () => {
  return (
    <footer className="bg-[#2C4F7C] text-white py-6" role="contentinfo" aria-label="フッター">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="col-span-1">
            <h3 className="text-lg font-bold mb-4">ビジネスライブラリーコネクト</h3>
            <p className="text-sm text-gray-300">
              企業間の知識共有を促進し、<br />
              効率的な学習環境を提供します。
            </p>
          </div>
          
          <div className="col-span-1">
            <h3 className="text-lg font-bold mb-4">サービス</h3>
            <ul className="footer-links space-y-2">
              <li>
                <Link href="/service" className="text-sm text-gray-300 hover:text-white transition-colors" aria-label="サービス概要">
                  サービス概要
                </Link>
              </li>
              <li>
                <Link href="/price" className="text-sm text-gray-300 hover:text-white transition-colors" aria-label="料金プラン">
                  料金プラン
                </Link>
              </li>
              <li>
                <Link href="/features" className="text-sm text-gray-300 hover:text-white transition-colors" aria-label="機能一覧">
                  機能一覧
                </Link>
              </li>
            </ul>
          </div>

          <div className="col-span-1">
            <h3 className="text-lg font-bold mb-4">会社情報</h3>
            <ul className="footer-links space-y-2">
              <li>
                <Link href="/company" className="text-sm text-gray-300 hover:text-white transition-colors" aria-label="会社概要">
                  会社概要
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-sm text-gray-300 hover:text-white transition-colors" aria-label="利用規約">
                  利用規約
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-sm text-gray-300 hover:text-white transition-colors" aria-label="プライバシーポリシー">
                  プライバシーポリシー
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-sm text-gray-300 hover:text-white transition-colors" aria-label="お問い合わせ">
                  お問い合わせ
                </Link>
              </li>
            </ul>
          </div>

          <div className="col-span-1">
            <h3 className="text-lg font-bold mb-4">フォローする</h3>
            <div className="flex space-x-4">
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                <FaTwitter className="w-6 h-6 text-gray-300 hover:text-white transition-colors" />
              </a>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
                <FaGithub className="w-6 h-6 text-gray-300 hover:text-white transition-colors" />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                <FaLinkedin className="w-6 h-6 text-gray-300 hover:text-white transition-colors" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-600 pt-6">
          <p className="text-center text-sm text-gray-300">
            © 2024 ビジネスライブラリーコネクト All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;