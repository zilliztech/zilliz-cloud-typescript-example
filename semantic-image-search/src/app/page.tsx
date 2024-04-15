import SearchPage from "./search";

export default async function Home() {
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
