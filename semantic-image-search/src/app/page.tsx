import SearchPage from "./search";
import { embedder } from "./utils/embedder";

const embedText = async (text: string) => {
  return await embedder.embed(text);
};
export default async function Home() {
  // This is server component, so we can pulling model when build
  const res = await embedText("hello world");
  console.log(res);
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
