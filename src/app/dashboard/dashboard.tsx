"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import Image from "next/image";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, query, orderBy, onSnapshot } from "firebase/firestore";

interface Assinatura {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  dataAssinatura: Date;
}

interface AssinaturasPorDia {
  [key: string]: Assinatura[];
}

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBrPjPyUV6BOhFWvmKqUXOrS8nTDlH-kDI",
  authDomain: "pactopeloagora.firebaseapp.com",
  projectId: "pactopeloagora",
  storageBucket: "pactopeloagora.appspot.com",
  messagingSenderId: "628056064610",
  appId: "1:628056064610:web:bc3a3c8d708fbc8bfe873b",
  measurementId: "G-Z9NB9MQKMB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
console.log("Firebase inicializado");

function groupByDay(assinaturas: Assinatura[]): AssinaturasPorDia {
  return assinaturas.reduce((acc, assinatura) => {
    const date = assinatura.dataAssinatura.toLocaleDateString('pt-BR');
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(assinatura);
    return acc;
  }, {} as AssinaturasPorDia);
}

function SignatureCounter({ count }: { count: number }) {
  return (
    <div className="bg-primary text-primary-foreground px-4 py-2 rounded-full text-lg font-semibold">
      Total de Assinaturas: {count}
    </div>
  );
}

export default function Dashboard() {
  console.log("Dashboard component renderizado");
  const [assinaturasPorDia, setAssinaturasPorDia] = useState<AssinaturasPorDia>({});
  const [totalAssinaturas, setTotalAssinaturas] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const updateAssinaturas = useCallback((assinaturas: Assinatura[]) => {
    console.log("Atualizando assinaturas:", assinaturas.length);
    const grouped = groupByDay(assinaturas);
    setAssinaturasPorDia(grouped);
    setTotalAssinaturas(assinaturas.length);
    console.log("Estado atualizado - Total:", assinaturas.length);
  }, []);

  useEffect(() => {
    console.log("Dashboard component mounted");
    setLoading(true);
    const assinaturasRef = collection(db, "assinaturas");
    const q = query(assinaturasRef, orderBy("dataAssinatura", "desc"));

    console.log("Setting up Firestore listener");
    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log("Snapshot received:", snapshot.docs.length);
      const assinaturas: Assinatura[] = snapshot.docs.map(doc => {
        const data = doc.data();
        console.log("Document data:", data);
        return {
          id: doc.id,
          nome: data.nome || '',
          email: data.email || '',
          telefone: data.telefone || '',
          dataAssinatura: data.dataAssinatura ? data.dataAssinatura.toDate() : new Date()
        };
      });
      console.log("Processed assinaturas:", assinaturas);
      updateAssinaturas(assinaturas);
      setLoading(false);
    }, (error) => {
      console.error("Error in onSnapshot:", error);
      setError("Erro ao obter dados: " + error.message);
      setLoading(false);
    });

    return () => {
      console.log("Unsubscribing from Firestore listener");
      unsubscribe();
    };
  }, [updateAssinaturas]);

  useEffect(() => {
    console.log("Total de assinaturas atualizado:", totalAssinaturas);
  }, [totalAssinaturas]);

  if (loading) {
    return <div>Carregando assinaturas...</div>;
  }

  if (error) {
    return <div>Erro: {error}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6 flex flex-col items-center justify-center">
      <div className="w-full max-w-4xl">
        <div className="h-2 bg-gradient-to-r from-cyan-400 via-blue-500 via-green-500 via-yellow-500 to-orange-500 rounded-t-lg"></div>
        <Card className="rounded-t-none shadow-xl">
          <CardHeader className="flex flex-col items-center space-y-4">
            <Image
              src="https://cdn.prod.website-files.com/66e2f3078ac962abc26bcc82/66e2f9eeac6b69554fb7d68b_logo-navbar.svg"
              alt="Pacto Pelo Agora Logo"
              width={200}
              height={50}
              className="mb-4"
            />
            <CardTitle className="text-3xl font-bold text-center text-primary">Assinaturas do Pacto Pelo Agora</CardTitle>
            <SignatureCounter count={totalAssinaturas} />
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[70vh]">
              {Object.keys(assinaturasPorDia).length === 0 ? (
                <p>Nenhuma assinatura encontrada.</p>
              ) : (
                <div className="space-y-6">
                  {Object.entries(assinaturasPorDia).sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime()).map(([date, assinaturas]) => (
                    <div key={date}>
                      <h2 className="text-xl font-semibold mb-2 text-primary">{date}</h2>
                      <div className="space-y-2">
                        {assinaturas.map((assinatura) => (
                          <Card key={assinatura.id} className="bg-white/50 backdrop-blur-sm">
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start mb-2">
                                <h3 className="text-lg font-semibold text-primary">{assinatura.nome}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {assinatura.dataAssinatura.toLocaleTimeString('pt-BR')}
                                </p>
                              </div>
                              <p className="text-sm text-muted-foreground">{assinatura.email}</p>
                              <p className="text-sm text-muted-foreground">{assinatura.telefone}</p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}