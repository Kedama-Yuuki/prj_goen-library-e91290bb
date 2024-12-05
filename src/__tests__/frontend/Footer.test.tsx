```typescript
import { render, screen } from '@testing-library/react';
import Footer from '@/pages/Footer';

describe('Footer', () => {
  test('コピーライト表示の確認', () => {
    render(<Footer />);
    expect(screen.getByText('© 2024 ビジネスライブラリーコネクト All Rights Reserved.')).toBeInTheDocument();
  });

  test('各種リンクの表示確認', () => {
    render(<Footer />);
    const links = [
      { text: '利用規約', href: '/terms' },
      { text: 'プライバシーポリシー', href: '/privacy' },
      { text: 'お問い合わせ', href: '/contact' },
      { text: '会社概要', href: '/company' }
    ];

    links.forEach(link => {
      const linkElement = screen.getByText(link.text);
      expect(linkElement).toBeInTheDocument();
      expect(linkElement).toHaveAttribute('href', link.href);
    });
  });

  test('フッターのレイアウト構造確認', () => {
    render(<Footer />);
    const footerElement = screen.getByRole('contentinfo');
    expect(footerElement).toHaveClass('footer');
    
    const linkContainer = screen.getByRole('list');
    expect(linkContainer).toHaveClass('footer-links');
    expect(linkContainer.children.length).toBe(4);
  });

  test('アクセシビリティ要件の確認', () => {
    render(<Footer />);
    const footerElement = screen.getByRole('contentinfo');
    expect(footerElement).toHaveAttribute('aria-label', 'フッター');
    
    const links = screen.getAllByRole('link');
    links.forEach(link => {
      expect(link).toHaveAttribute('aria-label');
    });
  });

  test('フッターのスタイル確認', () => {
    render(<Footer />);
    const footerElement = screen.getByRole('contentinfo');
    const styles = window.getComputedStyle(footerElement);
    
    expect(styles.backgroundColor).toBe('#2C4F7C');
    expect(styles.color).toBe('#FFFFFF');
    expect(styles.padding).toBe('24px 0');
  });
});
```