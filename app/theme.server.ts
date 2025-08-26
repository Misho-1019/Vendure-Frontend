// app/theme.server.ts
import { request, gql } from 'graphql-request';

const SHOP_API = process.env.VENDURE_SHOP_API!;
const Q = gql/* GraphQL */ `
  query Theme {
    siteTheme {
      title
      primaryColor
    }
  }
`;

export type SiteTheme = { title: string; primaryColor: string };

export async function getTheme(): Promise<SiteTheme> {
  const { siteTheme } = await request<{ siteTheme: SiteTheme }>(SHOP_API, Q);
  return siteTheme;
}
