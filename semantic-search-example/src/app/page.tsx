import SearchPage from "./search";
import { embedder } from "./utils/embedder";
const embedText = async (text: string) => {
  return await embedder.embed(text);
};
export default async function Home() {
  // This is server component, so we can pulling model when build
  await embedText("hello world");
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
