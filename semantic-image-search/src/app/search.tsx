"use client";
import { Button, Input } from "@nextui-org/react";
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
  });

  // Function to perform search
  const handleSearch = async (text: string) => {
    if (!text) return;
    try {
      setLoading((v) => ({
        ...v,
        search: true,
      }));
      const res = await axios.post(`/api/milvus/search`, { text });
      setData(res.data?.results || []);
    } finally {
      setLoading((v) => ({
        ...v,
        search: false,
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
        className="full-width"
        onChange={(e) => setValue(e.target.value)}
        endContent={
          <Button
            variant="light"
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
      <ImageGrid images={data} />
    </main>
  );
}
