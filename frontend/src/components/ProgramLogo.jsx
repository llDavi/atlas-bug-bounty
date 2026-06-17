import { useState } from "react";

export default function ProgramLogo({ program, logoStyle, className }) {
  const [errored, setErrored] = useState(false);

  if (program.logo && !errored) {
    return (
      <img
        src={program.logo}
        alt=""
        onError={() => setErrored(true)}
        className={`object-contain rounded-lg bg-white shrink-0 ${className}`}
      />
    );
  }

  return (
    <div className={`flex items-center justify-center rounded-lg font-semibold shrink-0 ${logoStyle} ${className}`}>
      {program.name.charAt(0)}
    </div>
  );
}
