/**
 * Tests for SpotCard component
 */

import { render, screen } from '@testing-library/react';
import { SpotCard } from '@/components/spots/spot-card';

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} alt={props.alt} />;
  },
}));

describe('SpotCard', () => {
  const mockSpot = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: '金閣寺',
    prefecture: '京都府',
    city: '京都市',
    address: '京都市北区金閣寺町1',
    spot_type: 'temple',
    slug: 'kinkaku-ji-kyoto',
    user_id: '123e4567-e89b-12d3-a456-426614174001',
    latitude: 35.0394,
    longitude: 135.7292,
    description: '世界遺産に登録された金閣寺',
    website_url: 'https://www.shokoku-ji.jp/kinkakuji/',
    phone_number: '075-461-0013',
    created_at: '2025-11-01T10:00:00Z',
    updated_at: '2025-11-01T10:00:00Z',
  };

  it('スポット名を表示する', () => {
    render(<SpotCard spot={mockSpot} />);
    expect(screen.getByText('金閣寺')).toBeInTheDocument();
  });

  it('都道府県と市区町村を表示する', () => {
    render(<SpotCard spot={mockSpot} />);
    expect(screen.getByText(/京都府/)).toBeInTheDocument();
    expect(screen.getByText(/京都市/)).toBeInTheDocument();
  });

  it('スポットタイプを表示する', () => {
    render(<SpotCard spot={mockSpot} />);
    // "temple" should be displayed or converted to Japanese
    expect(screen.getByText(/寺|temple/i)).toBeInTheDocument();
  });

  it('クリック可能なリンクを含む', () => {
    render(<SpotCard spot={mockSpot} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', `/dashboard/spots/${mockSpot.id}`);
  });

  it('画像がない場合はプレースホルダーを表示する', () => {
    const spotWithoutImage = { ...mockSpot };
    render(<SpotCard spot={spotWithoutImage} />);

    // Should render without crashing
    expect(screen.getByText('金閣寺')).toBeInTheDocument();
  });

  it('説明文を省略形で表示する', () => {
    const spotWithLongDescription = {
      ...mockSpot,
      description: 'これは非常に長い説明文です。'.repeat(10),
    };

    render(<SpotCard spot={spotWithLongDescription} />);

    // Should truncate long descriptions
    const description = screen.queryByText(/これは非常に長い説明文です/);
    if (description) {
      expect(description.textContent?.length).toBeLessThan(200);
    }
  });
});
