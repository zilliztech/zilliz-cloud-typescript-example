"use client";
import {
  Button,
  Input,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@nextui-org/react";
import axios from "axios";
import { useEffect, useMemo, useState } from "react";

// Define the structure of the CSV data
interface csvDataType {
  id: string;
  question: string;
  answer: string;
}

export default function SearchPage() {
  // Define state variables
  const [value, setValue] = useState("");
  const [data, setData] = useState<{ [x in string]: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [csvData, setCsvData] = useState<csvDataType[]>([]);

  // Function to load CSV data
  const loadCsv = async () => {
    try {
      setLoading(true);
      await axios.get(`/api/milvus/loadCsv?startRow=500`);
      window.alert("Load 500 QAs successfully");
    } catch (e) {
      window.alert(`Load 500 QAs failed:${e}`);
    } finally {
      setLoading(false);
    }
  };

  // Function to perform search
  const search = async (text: string) => {
    try {
      setSearchLoading(true);
      const res = await axios.post(`/api/milvus/search`, { text });
      console.log(res);
      setData(res.data?.results || []);
    } finally {
      setSearchLoading(false);
    }
  };

  // Define headers for the table
  const { headers } = useMemo(() => {
    if (data.length === 0)
      return {
        headers: ["id", "score", "question", "answer"],
      };
    const headers = Object.keys(data[0]);
    return { headers };
  }, [data]);

  // Initialize Milvus and load CSV data on component mount
  useEffect(() => {
    const initMilvus = async () => {
      try {
        await axios.get(`/api/milvus`);
      } catch (error) {
        window.alert(
          "Init Milvus and create collection failed, please check the your env. "
        );
      }
    };
    // prepare random question data
    const loadCsvData = async () => {
      const data = await axios.get("/api/milvus/loadCsv?onlyCsv=true");
      setCsvData(data.data as csvDataType[]);
    };
    initMilvus();
    loadCsvData();
  }, []);

  // Function to perform search with a random question
  const searchByRandom = async () => {
    const randomIndex = Math.floor(Math.random() * csvData.length);
    const randomQuestion = csvData[randomIndex].question;
    setValue(randomQuestion);
    await search(randomQuestion);
  };

  return (
    <main className="container mx-auto mt-40">
      {/* Note: API requests may timeout on Vercel's free plan as it has a maximum timeout limit of 10 seconds */}
      <Button
        onClick={() => {
          loadCsv();
        }}
        isLoading={loading}
        disabled={loading}
        className="fixed top-2 right-2"
        variant="faded"
      >
        {!loading ? "Load 500 QAs" : "Embedding and inserting ...(3mins)"}
      </Button>
      <div className="flex flex-col gap-6">
        <Input
          value={value}
          placeholder="Enter your text to search"
          className="full-width"
          onChange={(e) => setValue(e.target.value)}
        />
        <div className="flex gap-6 justify-between">
          <Button
            color="secondary"
            size="lg"
            className="center "
            fullWidth
            onClick={searchByRandom}
            isLoading={searchLoading}
          >
            Ask Random Question
          </Button>
          <Button
            onClick={() => {
              search(value);
            }}
            color="primary"
            size="lg"
            className="center"
            fullWidth
            isLoading={searchLoading}
          >
            Ask
          </Button>
        </div>
      </div>
      <p className="mt-10 font-bold text-lg text-center">{data[0]?.answer}</p>
      <Table aria-label="Search result table " className="mt-10">
        <TableHeader>
          {headers.map((header) => (
            <TableColumn key={header}>{header.toLocaleUpperCase()}</TableColumn>
          ))}
        </TableHeader>

        <TableBody>
          {data.map((row, index) => {
            return (
              <TableRow key={index}>
                {headers.map((header) => (
                  <TableCell key={header}>{row[header]}</TableCell>
                ))}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </main>
  );
}
