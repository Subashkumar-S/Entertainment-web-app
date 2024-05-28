// types.ts

export interface Thumbnail {
    small: string;
    large: string;
  }
  
  export interface RegularThumbnail {
    small: string;
    medium: string;
    large: string;
  }
  
  export interface TrendingDataItem {
    title: string;
    thumbnail: {
      regular: RegularThumbnail;
      trending: Thumbnail;
    };
    year: number;
    category: string;
    rating: string;
    isBookmarked: boolean;
    isTrending: boolean;
  }

  export interface RegularDataItem {
    title: string;
    thumbnail: string;
    year: number;
    category: string;
    rating: string;
    isBookmarked: boolean;
    isTrending: boolean;
  }
  