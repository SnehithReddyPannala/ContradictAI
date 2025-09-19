import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <Image src="/logo.png" alt="Logo" width={100} height={100} />
      <h1 className="text-5xl font-extrabold text-gray-900 mb-6">CONTRADICT AI</h1>
      <p className="text-xl text-gray-700 mb-10 text-center max-w-2xl">
        Effortlessly identify contradictions and conflicts across multiple documents using the power of Gemini AI.
      </p>

      <div className="flex space-x-6">
        <Link href="/upload" legacyBehavior>
          <a className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg text-xl transition duration-300 ease-in-out transform hover:-translate-y-1 shadow-lg">
            Get Started
          </a>
        </Link>
        <Link href="/dashboard" legacyBehavior>
          <a className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg text-xl transition duration-300 ease-in-out transform hover:-translate-y-1 shadow-lg">
            View Dashboard
          </a>
        </Link>
      </div>

      <div className="mt-16 text-gray-600 text-center">
        <p>&copy; {new Date().getFullYear()} Smart Doc Checker. All rights reserved.</p>
      </div>
    </div>
  );
}
