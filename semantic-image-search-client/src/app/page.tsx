import SearchPage from "./search";

export default async function Home() {
  // This is server component, so we can pulling model when build
  return (
    <div>
      <SearchPage />
    </div>
  );
}

export const metadata = {
  title: "Semantic Search - Zilliz",
  icons: {
    icon: "/icon.svg",
  },
};
