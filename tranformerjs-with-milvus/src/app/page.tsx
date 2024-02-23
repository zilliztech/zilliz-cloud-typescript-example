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
import { useMemo, useState } from "react";

export const dynamic = "force-dynamic";

export default function Home() {
  const [value, setValue] = useState("");
  const [data, setData] = useState([]);

  const loadCsv = async () => {
    const res = await axios.get(`/api/milvus/loadCsv`);
    console.log(res);
  };

  const search = async (text: string) => {
    const res = await axios.post(`/api/milvus/search`, { text });
    console.log(res);
    setData(res.data.results);
  };

  const { headers } = useMemo(() => {
    if (data.length === 0) return { headers: [] };
    const headers = Object.keys(data[0]);
    return { headers };
  }, [data]);

  return (
    <main className="container mx-auto mt-40">
      <Button
        onClick={() => {
          loadCsv();
        }}
      >
        loadCsv
      </Button>
      <div className="flex flex-col gap-6">
        <Input
          value={value}
          placeholder="Enter your text to search"
          className="full-width"
          onChange={(e) => setValue(e.target.value)}
        />
        <Button
          onClick={() => {
            search(value);
          }}
          color="primary"
          size="lg"
          className="center"
          fullWidth
        >
          search
        </Button>
      </div>
      {data.length ? (
        <Table aria-label="Search result table " className="mt-10">
          <TableHeader>
            {headers.map((header) => (
              <TableColumn key={header}>
                {header.toLocaleUpperCase()}
              </TableColumn>
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
      ) : null}
    </main>
  );
}
