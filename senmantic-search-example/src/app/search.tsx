"use client";
import { load } from "@grpc/proto-loader";
import {
  Button,
  Input,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@nextui-org/react";
import axios from "axios";
import { useEffect, useState } from "react";
import React from "react";

// Define the structure of the CSV data
interface csvDataType {
  id: string;
  question: string;
  answer: string;
}
const HEADERS = ["id", "score", "question", "answer", "csvId"];
let timer: NodeJS.Timeout | null = null;
export default function SearchPage() {
  // Define state variables
  const [value, setValue] = useState("");
  const [data, setData] = useState<{ [x in string]: string }[]>([]);
  const [loading, setLoading] = useState({
    search: false,
    insertCsv: false,
    insert: false,
    page: true,
  });
  const [csvData, setCsvData] = useState<csvDataType[]>([]);
  const [insertProgress, setInsertProgress] = useState(0);
  const [form, setForm] = useState<{ question: string; answer: string }>({
    question: "",
    answer: "",
  });
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();

  const getLoadCsvProgress = async () => {
    const data = (await axios.get("/api/milvus/loadCsv/progress")).data;
    const progress = data.progress;
    const isInserting = data.isInserting;
    const errorMsg = data.errorMsg;

    if (errorMsg) {
      window.alert(errorMsg);
      setLoading((v) => ({
        ...v,
        insertCsv: false,
      }));
      setInsertProgress(0);
      return;
    }

    setInsertProgress(progress);
    setLoading((v) => ({
      ...v,
      insertCsv: isInserting,
    }));
    if ((progress < 100 && progress > 0) || isInserting) {
      timer = setTimeout(getLoadCsvProgress, 1000);
    }

    if (progress === 100) {
      setLoading((v) => ({
        ...v,
        insertCsv: false,
      }));
      timer && clearTimeout(timer);
      timer = null;
    }
  };
  // Function to load CSV data
  const loadCsv = async () => {
    try {
      setLoading((v) => ({
        ...v,
        insertCsv: true,
      }));
      await axios.get(`/api/milvus/loadCsv?startRow=500`);
      setTimeout(() => {
        getLoadCsvProgress();
      }, 1000);
    } catch (e) {
      window.alert(`Load 500 QAs failed:${e}`);
      setLoading((v) => ({
        ...v,
        insertCsv: false,
      }));
    }
  };

  // Function to perform search
  const search = async (text: string) => {
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

  // Initialize Milvus and load CSV data on component mount
  useEffect(() => {
    const init = async () => {
      try {
        setLoading((v) => ({
          ...v,
          page: true,
        }));
        const [csvData] = await Promise.all([
          await axios.get("/api/milvus/loadCsv?onlyCsv=true"),
          await axios.get(`/api/milvus`),
          await getLoadCsvProgress(),
        ]);
        setCsvData(csvData.data as csvDataType[]);
      } catch (error) {
        window.alert(
          "Init Milvus and create collection failed, please check the your env. "
        );
      } finally {
        setLoading((v) => ({
          ...v,
          page: false,
        }));
      }
    };

    init();
  }, []);

  // Function to perform search with a random question
  const searchByRandom = async () => {
    const randomIndex = Math.floor(Math.random() * csvData.length);
    const randomQuestion = csvData[randomIndex].question;
    setValue(randomQuestion);
    await search(randomQuestion);
  };

  const handleInsert = async () => {
    try {
      await axios.post(`/api/milvus/insert`, form);
      onClose();
    } catch (e) {
      window.alert(`Insert data failed:${e}`);
    }
  };
  return (
    <main className="container mx-auto mt-40">
      {/* Note: API requests may timeout on Vercel's free plan as it has a maximum timeout limit of 10 seconds */}
      <Button
        onClick={() => {
          loadCsv();
        }}
        isLoading={loading.insertCsv}
        isDisabled={loading.page}
        className="fixed top-2 right-32"
        variant="faded"
      >
        {!loading.insertCsv
          ? `Load 1000 QAs`
          : `Embedding and inserting ...(${insertProgress}%)`}
      </Button>
      <Button
        onPress={onOpen}
        className="fixed top-2 right-2"
        variant="faded"
        isDisabled={loading.page}
      >
        Insert data
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
            isLoading={loading.search}
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
            isLoading={loading.search}
          >
            Ask
          </Button>
        </div>
      </div>
      <p className="mt-10 font-bold text-lg text-center">{data[0]?.answer}</p>
      <Table aria-label="Search result table " className="mt-10">
        <TableHeader>
          {HEADERS.map((header) => (
            <TableColumn key={header}>{header.toLocaleUpperCase()}</TableColumn>
          ))}
        </TableHeader>

        <TableBody>
          {data.map((row, index) => {
            return (
              <TableRow key={index}>
                {HEADERS.map((header) => (
                  <TableCell key={header}>{row[header]}</TableCell>
                ))}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Modal Title
              </ModalHeader>
              <ModalBody>
                <Input
                  value={form.question}
                  onChange={(e) =>
                    setForm((v) => ({ ...v, question: e.target.value }))
                  }
                  label="Question"
                  placeholder="Enter your question"
                />
                <Input
                  value={form.answer}
                  onChange={(e) =>
                    setForm((v) => ({ ...v, answer: e.target.value }))
                  }
                  label="Answer"
                  placeholder="Enter your answer"
                />
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  Close
                </Button>
                <Button
                  color="primary"
                  onPress={handleInsert}
                  isLoading={loading.insert}
                >
                  Insert
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </main>
  );
}
