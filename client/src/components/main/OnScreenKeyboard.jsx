import React from "react";
import { Delete, CornerDownLeft } from "lucide-react";

const KEYS = [
  ["1","2","3","4","5","6","7","8","9","0"],
  ["Q","W","E","R","T","Y","U","I","O","P"],
  ["A","S","D","F","G","H","J","K","L"],
  ["Z","X","C","V","B","N","M"],
];

export default function OnScreenKeyboard({ onKeyPress }) {
  const handleClick = (key) => {
    if (onKeyPress) onKeyPress(key);
  };

  return (
    <div className="select-none">
      <div className="grid gap-3 p-4 bg-gray-100 rounded-2xl shadow-inner w-fit mx-auto">
        {/* Number row */}
        {KEYS.map((row, i) => (
          <div key={i} className="flex justify-center gap-3">
            {row.map((key) => (
              <button
                key={key}
                onClick={() => handleClick(key)}
                className="bg-white text-gray-900 font-bold text-xl px-6 py-4 rounded-xl shadow hover:bg-gray-200 active:scale-95 transition"
              >
                {key}
              </button>
            ))}
          </div>
        ))}

        {/* Special keys */}
        <div className="flex justify-center gap-3 mt-3">
          <button
            onClick={() => handleClick(" ")}
            className="bg-white text-gray-900 font-bold text-xl px-16 py-4 rounded-xl shadow hover:bg-gray-200 active:scale-95 transition"
          >
            Space
          </button>
          <button
            onClick={() => handleClick("BACKSPACE")}
            className="bg-white text-gray-900 font-bold text-xl px-6 py-4 rounded-xl shadow hover:bg-gray-200 active:scale-95 transition flex items-center gap-2"
          >
            <Delete size={22} /> Backspace
          </button>
          <button
            onClick={() => handleClick("ENTER")}
            className="bg-green-500 text-white font-bold text-xl px-6 py-4 rounded-xl shadow hover:bg-green-600 active:scale-95 transition flex items-center gap-2"
          >
            <CornerDownLeft size={22} /> Enter
          </button>
        </div>
      </div>
    </div>
  );
}
