import { cssBundleHref } from '@remix-run/css-bundle';
import type { Order } from '~/generated/graphql';
import {
  isRouteErrorResponse,
  Link,
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  ShouldRevalidateFunction,
  useLoaderData,
  useRouteError,
  MetaFunction,
} from '@remix-run/react';
import stylesheet from './tailwind.css';
import brandCss from './styles/brand.css';
import { Header } from './components/header/Header';
import {
  DataFunctionArgs,
  json,
  LinksFunction,
} from '@remix-run/server-runtime';
import { getCollections } from '~/providers/collections/collections';
import { activeChannel } from '~/providers/channel/channel';
import { APP_META_DESCRIPTION, APP_META_TITLE } from '~/constants';
import { useEffect, useState } from 'react';
import { CartTray } from '~/components/cart/CartTray';
import { getActiveCustomer } from '~/providers/customer/customer';
import Footer from '~/components/footer/Footer';
import { useActiveOrder } from '~/utils/use-active-order';
import { useChangeLanguage } from 'remix-i18next';
import { useTranslation } from 'react-i18next';
import { getI18NextServer } from '~/i18next.server';

// 👇 new: fetch siteTheme (title, primaryColor) from Vendure
import { getTheme, type SiteTheme } from './theme.server';

export const meta: MetaFunction = () => {
  return [{ title: APP_META_TITLE }, { description: APP_META_DESCRIPTION }];
};

export const links: LinksFunction = () => [
  { rel: 'stylesheet', href: stylesheet },
  ...(cssBundleHref ? [{ rel: 'stylesheet', href: cssBundleHref }] : []),
  { rel: 'stylesheet', href: brandCss }, // load last so it overrides
];

const devMode =
  typeof process !== 'undefined' && process.env.NODE_ENV === 'development';

// The root data does not change once loaded.
export const shouldRevalidate: ShouldRevalidateFunction = ({
  nextUrl,
  currentUrl,
  formAction,
}) => {
  if (currentUrl.pathname === '/sign-in') {
    // just logged in
    return true;
  }
  if (currentUrl.pathname === '/account' && nextUrl.pathname === '/') {
    // just logged out
    return true;
  }
  if (formAction === '/checkout/payment') {
    // submitted payment for order
    return true;
  }
  return false;
};

export type RootLoaderData = {
  activeCustomer: Awaited<ReturnType<typeof getActiveCustomer>>;
  activeChannel: Awaited<ReturnType<typeof activeChannel>>;
  collections: Awaited<ReturnType<typeof getCollections>>;
  locale: string;
  // 👇 new
  theme: SiteTheme | null;
};

export async function loader({ request }: DataFunctionArgs) {
  const collections = await getCollections(request, { take: 20 });
  const topLevelCollections = collections.filter(
    (collection) => collection.parent?.name === '__root_collection__',
  );
  const activeCustomer = await getActiveCustomer({ request });
  const locale = await getI18NextServer().then((i18next) =>
    i18next.getLocale(request),
  );

  // 👇 new: fetch theme safely (don’t break page if backend/env is down)
  const theme = await getTheme().catch(() => null);

  const loaderData: RootLoaderData = {
    activeCustomer,
    activeChannel: await activeChannel({ request }),
    collections: topLevelCollections,
    locale,
    theme,
  };

  return json(loaderData, { headers: activeCustomer._headers });
}

function isOrder(x: any): x is Order {
  return !!x && typeof x.id === 'string' && typeof x.code === 'string';
}

// add once above App()
function hexToRgb(hex: string): string {
  let h = hex.replace('#', '');
  if (h.length === 3)
    h = h
      .split('')
      .map((c) => c + c)
      .join('');
  const n = parseInt(h, 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
}

export default function App() {
  const [open, setOpen] = useState(false);
  const loaderData = useLoaderData<RootLoaderData>();
  const { collections, locale, theme } = loaderData;
  const { i18n } = useTranslation();
  const {
    activeOrderFetcher,
    activeOrder,
    adjustOrderLine,
    removeItem,
    refresh,
  } = useActiveOrder();

  useChangeLanguage(locale);

  useEffect(() => {
    // When the loader has run, this implies we should refresh the contents
    // of the activeOrder as the user may have signed in or out.
    refresh();
  }, [loaderData]);

  // 👇 new: derive title + CSS color var
  const pageTitle = theme?.title ?? APP_META_TITLE;
  const primaryColor = theme?.primaryColor ?? '#3b82f6';

  const primaryRgb = hexToRgb(primaryColor);

  return (
    <html lang={locale} dir={i18n.dir()} id="app">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <link rel="icon" href="/favicon.ico" type="image/png"></link>
        <Meta />
        <Links />
        {/* 👇 this will override the meta() title with CMS/Vendure title */}
        <title>{pageTitle}</title>
      </head>
      {/* 👇 make primary color available to all CSS via var */}
      <body
        style={{
          ['--color-primary' as any]: primaryColor,
          ['--color-primary-rgb' as any]: primaryRgb,
        }}
      >
        <Header
          onCartIconClick={() => setOpen(!open)}
          cartQuantity={activeOrder?.totalQuantity ?? 0}
        />
        <main className="">
          <Outlet
            context={{
              activeOrderFetcher,
              activeOrder,
              adjustOrderLine,
              removeItem,
            }}
          />
        </main>
        {isOrder(activeOrder) && (
          <CartTray
            open={open}
            onClose={setOpen}
            activeOrder={activeOrder}
            adjustOrderLine={adjustOrderLine}
            removeItem={removeItem}
          />
        )}

        <ScrollRestoration />
        <Scripts />
        <Footer collections={collections}></Footer>

        {devMode && <LiveReload />}
      </body>
    </html>
  );
}

type DefaultSparseErrorPageProps = {
  tagline: string;
  headline: string;
  description: string;
};

/**
 * You should replace this in your actual storefront to provide a better user experience.
 * You probably want to still show your footer and navigation. You will also need fallbacks
 * for your data dependant components in case your shop instance / CMS isnt responding.
 * See: https://remix.run/docs/en/main/route/error-boundary
 */
function DefaultSparseErrorPage({
  tagline,
  headline,
  description,
}: DefaultSparseErrorPageProps) {
  return (
    <html lang="en" id="app">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <link rel="icon" href="/favicon.ico" type="image/png"></link>
        <Meta />
        <Links />
      </head>
      <body>
        <main className="flex flex-col items-center px-4 py-16 sm:py-32 text-center">
          <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            {tagline}
          </span>
          <h1 className="mt-2 font-bold text-gray-900 tracking-tight text-4xl sm:text-5xl">
            {headline}
          </h1>
          <p className="mt-4 text-base text-gray-500 max-w-full break-words">
            {description}
          </p>
          <div className="mt-6">
            <Link
              to="/"
              className="text-base font-medium text-brand hover:text-brand/80 inline-flex gap-2"
            >
              Go back home
            </Link>
          </div>
        </main>
        <ScrollRestoration />
        <Scripts />
        {devMode && <LiveReload />}
      </body>
    </html>
  );
}

/**
 * You should replace this to suit your needs.
 */
export function ErrorBoundary() {
  let tagline = 'Oopsy daisy';
  let headline = 'Unexpected error';
  let description = "We couldn't handle your request. Please try again later.";

  const error = useRouteError();
  if (isRouteErrorResponse(error)) {
    tagline = `${error.status} error`;
    headline = error.statusText;
    description = error.data;
  }

  return (
    <DefaultSparseErrorPage
      tagline={tagline}
      headline={headline}
      description={description}
    />
  );
}

/**
 * In Remix v2 there will only be an ErrorBoundary.
 */
export function CatchBoundary() {
  return ErrorBoundary();
}
