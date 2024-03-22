import SearchPage from "./search";
import { embedder } from "./utils/embedder";

const embedText = async (text: string) => {
  return await embedder.embed(text);
};
export default async function Home() {
  // pulling model at first time
  await embedText("hello world");
  return (
    <div>
      <SearchPage />
    </div>
  );
}
