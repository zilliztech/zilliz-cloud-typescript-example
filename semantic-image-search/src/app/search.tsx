"use client";
import { Button, CircularProgress, Input } from "@nextui-org/react";
import axios from "axios";
import { useEffect, useState } from "react";
import React from "react";
import { ImageGrid, ImageType } from "./components/ImageGrid";

export default function SearchPage() {
  // Define state variables
  const [value, setValue] = useState("");
  const [data, setData] = useState<ImageType[]>([]);
  const [loading, setLoading] = useState({
    search: false,
    insertCsv: false,
    insert: false,
    page: true,
    imageSearch: false,
  });

  // Function to perform search
  const handleSearch = async (text: string) => {
    if (!text) return;
    try {
      setLoading((v) => ({
        ...v,
        search: true,
        imageSearch: text.includes("https"),
      }));
      const res = await axios.get(`/api/milvus/search?text=${text}`);
      setData(res.data?.results || []);
    } finally {
      setLoading((v) => ({
        ...v,
        search: false,
        imageSearch: false,
      }));
    }
  };

  // Upon component mounting, initialize Milvus and load CSV data for utilization as random queries
  useEffect(() => {
    const init = async () => {
      try {
        setLoading((v) => ({
          ...v,
          page: true,
        }));
        await axios.get(`/api/milvus`);
      } catch (error) {
        window.alert("Init Milvus  failed, please check the your env. ");
      } finally {
        setLoading((v) => ({
          ...v,
          page: false,
        }));
      }
    };

    init();
  }, []);

  return (
    <main className="mx-auto max-w-[1960px] p-4 relative">
      <Input
        value={value}
        placeholder="Enter your text to search"
        className="full-width mb-4"
        onChange={(e) => setValue(e.target.value)}
        endContent={
          <Button
            variant="solid"
            color="primary"
            size="lg"
            onClick={() => handleSearch(value)}
            isLoading={loading.search}
            disabled={loading.page}
          >
            Search
          </Button>
        }
      />
      {loading.imageSearch && (
        <div className="fixed inset-0 gap-4 flex items-center justify-center z-50">
          <div className="bg-black opacity-50 absolute inset-0"></div>
          <CircularProgress size="lg" className="z-50" />
          <p className=" text-2xl font-bold">Searching with image ...</p>
        </div>
      )}
      <ImageGrid images={data} setImgUrl={handleSearch} />
    </main>
  );
}
