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
  question: string;
  answer: string;
}

let timer: NodeJS.Timeout | null = null;

const HEADERS = ["id", "score", "question", "answer"];
// Note: Load CSV file are hidden when deployed on Vercel.
const SUPPORT_IMPORT =
  process.env.NEXT_PUBLIC_SUPPORT_IMPORT?.toLocaleLowerCase() === "true";

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

  // Function to get the progress of loading CSV data
  const getLoadCsvProgress = async () => {
    // Fetch the progress data from the server
    const data = (await axios.get("/api/milvus/loadCsv/progress")).data;
    const progress = data.progress;
    const isInserting = data.isInserting;
    const errorMsg = data.errorMsg;

    // If there is an error message, alert the user and stop loading
    if (errorMsg) {
      window.alert(errorMsg);
      setLoading((v) => ({
        ...v,
        insertCsv: false,
      }));
      setInsertProgress(0);
      return;
    }

    // Update the progress state
    setInsertProgress(progress);
    // Update the loading state based on whether data is still being inserted
    setLoading((v) => ({
      ...v,
      insertCsv: isInserting,
    }));
    // If progress is not complete or data is still being inserted, continue checking progress every second
    if ((progress < 100 && progress > 0) || isInserting) {
      timer = setTimeout(getLoadCsvProgress, 1000);
    }

    // If progress is complete, stop loading and clear the timer
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
      await axios.get(`/api/milvus/loadCsv`);
      setTimeout(() => {
        getLoadCsvProgress();
      }, 1000);
    } catch (e) {
      window.alert(`Load CSV file failed:${e}`);
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

  // Upon component mounting, initialize Milvus and load CSV data for utilization as random queries
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

  // Function to search by random question
  const searchByRandom = async () => {
    // Generate a random index
    const randomIndex = Math.floor(Math.random() * csvData.length);
    // Get the question at the random index
    const randomQuestion = csvData[randomIndex].question;
    // Set the value to the random question
    setValue(randomQuestion);
    // Perform the search
    await search(randomQuestion);
  };

  // Function to handle data insertion
  const handleInsert = async () => {
    try {
      setLoading((v) => ({
        ...v,
        insert: true,
      }));
      // Post the form data to the insert API
      await axios.post(`/api/milvus/insert`, form);
      // Close the modal after successful insertion
      onClose();
    } catch (e) {
      // Alert the user if insertion fails
      window.alert(`Insert data failed:${e}`);
      setLoading((v) => ({
        ...v,
        insert: false,
      }));
    }
  };

  return (
    <main className="container mx-auto">
      <div className="flex justify-between mt-4">
        <a target="_blank" href="https://zilliz.com">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="logo" />
        </a>
        <div className="flex gap-2">
          {/* Note: API requests may timeout on Vercel's free plan as it has a maximum timeout limit of 10 seconds*/}
          {SUPPORT_IMPORT && (
            <>
              <Button
                onClick={() => {
                  loadCsv();
                }}
                isLoading={loading.insertCsv}
                isDisabled={loading.page}
                variant="faded"
              >
                {!loading.insertCsv
                  ? `Load 1000 QAs`
                  : `Embedding and inserting ...(${insertProgress}%)`}
              </Button>
              {/* Button to open the insert data modal */}
              <Button
                onPress={onOpen}
                variant="faded"
                isDisabled={loading.page}
              >
                Insert data
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-6 mt-40">
        {/* Input field for the user to enter text to search */}
        <Input
          value={value}
          placeholder="Enter your text to search"
          className="full-width"
          onChange={(e) => setValue(e.target.value)}
        />
        <div className="flex gap-6 justify-between">
          {/* Button to ask a random question */}
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
          {/* Button to perform the search */}
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
      {/* Display the answer to the first question */}
      <p className="mt-10 font-bold text-lg text-center">{data[0]?.answer}</p>
      {/* Table to display the search results */}
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

      {/* Modal for inserting data */}
      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Modal Title
              </ModalHeader>
              <ModalBody>
                {/* Input field for the question */}
                <Input
                  value={form.question}
                  onChange={(e) =>
                    setForm((v) => ({ ...v, question: e.target.value }))
                  }
                  label="Question"
                  placeholder="Enter your question"
                />
                {/* Input field for the answer */}
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
                {/* Button to close the modal */}
                <Button variant="light" onPress={onClose}>
                  Close
                </Button>
                {/* Button to insert the data */}
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
