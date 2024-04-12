"use client";
import { Button, Input } from "@nextui-org/react";
import axios from "axios";
import { useCallback, useEffect, useRef, useState } from "react";
import React from "react";
import { ImageGrid, ImageType } from "./components/ImageGrid";

export default function SearchPage() {
  // Define state variables
  const [ready, setReady] = useState<boolean | null>(null);
  const [value, setValue] = useState("");
  const [data, setData] = useState<ImageType[]>([]);
  const [searchVectors, setSearchVectors] = useState<number[]>([]);
  const [loading, setLoading] = useState({
    search: false,
    insertCsv: false,
    insert: false,
    page: true,
  });

  // Create a reference to the worker object.
  const worker = useRef<Worker | null>(null);

  // We use the `useEffect` hook to set up the worker as soon as the `App` component is mounted.
  useEffect(() => {
    if (!worker.current) {
      // Create the worker if it does not yet exist.
      worker.current = new Worker(new URL("./worker.js", import.meta.url), {
        type: "module",
      });
    }

    const onMessageReceived = (e: any) => {
      console.log(e);

      switch (e.data.status) {
        case "initiate":
          setReady(false);
          break;
        case "ready":
          setReady(true);
          break;
        case "complete":
          console.log("--- component worker complete", e.data.output);

          setSearchVectors(e.data.output);
          break;
      }
    };

    // Attach the callback function as an event listener.
    worker.current.addEventListener("message", onMessageReceived);

    // Define a cleanup function for when the component is unmounted.
    return () => {
      worker.current &&
        worker.current.removeEventListener("message", onMessageReceived);
    };
  });

  const handleSearch = (text: string) => {
    if (worker.current) {
      setLoading((v) => ({
        ...v,
        search: true,
      }));
      worker.current.postMessage({ text });
    }
  };

  useEffect(() => {
    const handleVectorSearch = async () => {
      if (!searchVectors.length) return;
      try {
        const res = await axios.post(`/api/milvus/search`, {
          vectors: Array.from(searchVectors),
        });
        setData(res.data?.results || []);
      } finally {
        setLoading((v) => ({
          ...v,
          search: false,
        }));
      }
    };
    handleVectorSearch();
  }, [searchVectors]);

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
        size="lg"
        endContent={
          <Button
            variant="solid"
            color="primary"
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
