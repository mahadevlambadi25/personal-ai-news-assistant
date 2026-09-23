export interface RawArticle {
  title: string;
  description?: string;
  content?: string;
  url: string;
  source: string;
  sourceName: string;
  author?: string;
  imageUrl?: string;
  publishedAt?: Date | string;
  categoryHint?: string;
  language?: string;
}

export interface INewsProvider {
  readonly name: string;
  fetchArticles(): Promise<RawArticle[]>;
}
