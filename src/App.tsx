import { useMemo, useState, useRef, useEffect } from "react";
import { generateId, validateId, formatId, Charset, Algorithm } from "structured-id";
import { Button } from "./components/ui/button";
import { Card, CardHeader, CardContent, CardTitle } from "./components/ui/card";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Checkbox } from "./components/ui/checkbox";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "./components/ui/select";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

export default function App() {
    const [charset, setCharset] = useState<Charset>("numeric");
    const [algorithm, setAlgorithm] = useState<Algorithm>("none");
    const [groups, setGroups] = useState(4);
    const [groupSize, setGroupSize] = useState(4);
    const [separator, setSeparator] = useState("-");
    const [useCrypto, setUseCrypto] = useState(true);
    const [mode, setMode] = useState<"generate" | "validate">("generate");
    const isGenerate = mode === "generate";
    const toggleMode = () => setMode(isGenerate ? "validate" : "generate");

    const [id, setId] = useState("");
    const [toValidate, setToValidate] = useState("");
    const [isValid, setIsValid] = useState<boolean | null>(null);

    const [copied, setCopied] = useState<null | "raw" | "formatted">(null);
    const copyTimer = useRef<number | null>(null);
    const prefersReduced = useReducedMotion();

    useEffect(() => {
      if (mode === "generate") {
        // Auto-generate a new ID when generation settings change
        const code = generateId({ charset, algorithm, groups, groupSize, useCrypto });
        setId(code);
        setIsValid(null);
        setCopied(null);
      } else {
        // In validate mode, re-run validation if there's input
        if (toValidate.trim()) {
          const ok = validateId(toValidate, { charset, algorithm, groups, groupSize });
          setIsValid(ok);
        } else {
          setIsValid(null);
        }
        setCopied(null);
      }
    }, [charset, groups, groupSize, algorithm, useCrypto, mode]);

    const totalLength = useMemo(() => groups * groupSize, [groups, groupSize]);
    const bitsPerChar = charset === "numeric" ? Math.log2(10) : Math.log2(36);
    const entropyBits = Math.round(bitsPerChar * totalLength);

    function handleGenerate() {
        const code = generateId({
            charset,
            algorithm,
            groups,
            groupSize,
            useCrypto,
        });

        setId(code);
        setIsValid(null);
    }

    function handleValidate() {
        const target = toValidate || id;
        const ok = validateId(target, { charset, algorithm, groups, groupSize });

        setIsValid(ok);
    }

    function copyToClipboard(text: string, which: "raw" | "formatted") {
        const trimmed = (text || "").trim();
        if (!trimmed || trimmed === "—") return;
        navigator.clipboard.writeText(trimmed).then(() => {
            setCopied(which);
            if (copyTimer.current) window.clearTimeout(copyTimer.current);
            copyTimer.current = window.setTimeout(() => setCopied(null), 1200);
        }).catch(() => {
            // no-op fallback; we could surface an error toast if desired
        });
    }

    const pretty = useMemo(() => {
        if (!id) return "";

        try {
            return formatId(id, { groups, groupSize, separator, charset });
        } catch {
            return id;
        }
    }, [id, groups, groupSize, separator, charset]);

    return (
      <div className="mx-auto max-w-3xl p-6 space-y-8">
        {/* Background (fixed) */}
        <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
          {/* soft radial glow from top */}
          <div className="absolute inset-0 bg-[radial-gradient(50%_50%_at_50%_0%,hsl(var(--primary)/0.10),transparent_60%)]" />
          {/* subtle grid pattern */}
          <svg
            className="absolute inset-0 h-full w-full opacity-[0.12] dark:opacity-[0.16]"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern id="sid-grid" width="32" height="32" patternUnits="userSpaceOnUse">
                <path d="M 32 0 L 0 0 0 32" fill="none" stroke="currentColor" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#sid-grid)" className="text-foreground" />
          </svg>
          {/* bottom vignette to fade content edges */}
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent" />
        </div>
        {/* Hero */}
        <header className="text-center space-y-3">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">structured-id</h1>
          <p className="text-sm text-muted-foreground">
            Generate &amp; validate structured IDs/codes with optional checksums.
          </p>
          <div className="flex items-center justify-center mt-4">
            <button
              type="button"
              role="switch"
              aria-checked={isGenerate}
              onClick={toggleMode}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  toggleMode();
                }
              }}
              className={`relative inline-grid grid-cols-2 items-center w-56 h-12 rounded-full border border-border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary ${isGenerate ? "bg-primary/10" : "bg-secondary/70"} overflow-hidden`}
              aria-label={isGenerate ? "Switch to Validate" : "Switch to Generate"}
            >
              {/* Labels (now in grid cells, centered) */}
              <span className={`z-10 text-sm font-medium select-none text-center ${isGenerate ? "text-foreground" : "text-muted-foreground"}`}>
                Generate
              </span>
              <span className={`z-10 text-sm font-medium select-none text-center ${!isGenerate ? "text-foreground" : "text-muted-foreground"}`}>
                Validate
              </span>
              {/* Knob */}
              <motion.span
                layout
                transition={{ type: "spring", stiffness: 400, damping: 35 }}
                className="absolute top-1 left-1 bottom-1 w-[calc(50%-8px)] rounded-full bg-background/95 shadow-md border border-border z-0 pointer-events-none"
                style={{ left: isGenerate ? 4 : "calc(50% + 4px)" }}
              />
            </button>
          </div>
        </header>

        {/* Big display */}
        <section>
          <AnimatePresence mode="wait">
            {mode === "generate" ? (
              <motion.div
                key="mode-generate"
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -12, scale: 0.98 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className="space-y-7"
              >
                <div className="relative">
                  <pre
                    role="button"
                    tabIndex={0}
                    title="Click to copy"
                    onClick={() => copyToClipboard(pretty, "raw")}
                    onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && copyToClipboard(pretty, "raw")}
                    className="mx-auto max-w-full select-text rounded-2xl bg-secondary/70 p-5 md:p-6 text-center text-xl md:text-2xl font-mono overflow-hidden shadow-sm cursor-pointer ring-0 hover:ring-1 ring-primary transition h-20 md:h-24 flex items-center justify-center will-change-transform transform-gpu"
                  >
                    <div className="relative h-full w-full overflow-hidden flex items-center justify-center">
                      <AnimatePresence initial={false} mode="wait">
                        {pretty ? (
                          <motion.span
                            key={pretty}
                            initial={prefersReduced ? { opacity: 0 } : { y: -24, opacity: 0 }}
                            animate={prefersReduced ? { opacity: 1 } : { y: 0, opacity: 1 }}
                            exit={prefersReduced ? { opacity: 0 } : { y: 24, opacity: 0 }}
                            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                            className="inline-block"
                          >
                            {pretty}
                          </motion.span>
                        ) : null}
                      </AnimatePresence>
                    </div>
                  </pre>
                  <AnimatePresence>
                    {copied === "raw" && (
                      <motion.span
                        key="copied-hero"
                        aria-live="polite"
                        className="absolute top-1/2 -translate-y-1/2 right-2 rounded bg-black/80 text-white text-xs px-2 py-0.5 shadow-sm"
                        initial={{ opacity: 0, y: -6, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.95 }}
                        transition={{ duration: 0.18 }}
                      >
                        Copied
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
                <div className="flex justify-center">
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}>
                    <Button className="transition shadow-sm hover:shadow-md" onClick={handleGenerate}>
                      Generate
                    </Button>
                  </motion.div>
                </div>
                <p className="text-center text-xs text-muted-foreground">Total length: <b>{totalLength}</b> • Entropy: <b>{entropyBits} bits</b></p>
              </motion.div>
            ) : (
              <motion.div
                key="mode-validate"
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -12, scale: 0.98 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className="space-y-7"
              >
                <div className="relative">
                  <Input
                    value={toValidate}
                    onChange={(e) => setToValidate(e.target.value)}
                    placeholder="Paste an ID to validate"
                    className="mx-auto w-full rounded-2xl bg-secondary/60 p-5 md:p-6 text-center text-xl md:text-2xl font-mono shadow-sm h-20 md:h-24"
                  />
                  <motion.button
                    whileHover={{ scale: 1.06 }}
                    whileTap={{ scale: 0.94 }}
                    type="button"
                    title="Paste from clipboard"
                    aria-label="Paste from clipboard"
                    onClick={async () => {
                      try {
                        const text = await navigator.clipboard.readText();
                        setToValidate(text);
                      } catch {
                        // Clipboard API may be unavailable; ignore
                      }
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center justify-center h-9 w-9 rounded-md border border-border bg-background/80 hover:bg-background transition shadow-sm hover:shadow-md"
                  >
                    {/* Clipboard icon as image */}
                    <img src="/paste.svg" alt="Paste" className="h-5 w-5 opacity-80" />
                  </motion.button>
                </div>
                <div className="flex items-center justify-center gap-3">
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}>
                    <Button variant="secondary" className="transition shadow-sm hover:shadow-md" onClick={handleValidate}>
                      Validate
                    </Button>
                  </motion.div>

                  <AnimatePresence mode="wait">
                    {isValid !== null && (
                      <motion.div
                        key={String(isValid)}
                        role="status"
                        aria-live="polite"
                        initial={{ opacity: 0, y: -6, scale: 0.95 }}
                        animate={{
                          opacity: 1,
                          y: 0,
                          scale: 1,
                          ...(isValid
                            ? {}
                            : { x: [0, -3, 3, -2, 2, 0] }) // subtle shake on invalid
                        }}
                        exit={{ opacity: 0, y: -6, scale: 0.95 }}
                        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium shadow-sm ${
                          isValid
                            ? "bg-green-100 text-green-800 border-green-300"
                            : "bg-red-100 text-red-800 border-red-300"
                        }`}
                      >
                        {isValid ? (
                          <>
                            {/* check-circle */}
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
                              <circle cx="12" cy="12" r="9"></circle>
                            </svg>
                            <span>Valid</span>
                          </>
                        ) : (
                          <>
                            {/* x-circle */}
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 9l-6 6m0-6l6 6" />
                              <circle cx="12" cy="12" r="9"></circle>
                            </svg>
                            <span>Invalid</span>
                          </>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <p className="text-center text-xs text-muted-foreground">
                  Uses current settings (charset, groups, group size, checksum) when validating.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Config cards */}
        <AnimatePresence mode="wait">
          {mode === "generate" ? (
            <motion.div
              key="cards-generate"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="grid gap-4 md:grid-cols-2"
            >
              {/* Options */}
              <Card>
                <CardHeader>
                  <CardTitle>Options</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Charset</Label>
                    <Select
                      value={charset}
                      onValueChange={(v: Charset) => {
                        setCharset(v);
                        if (v === "numeric" && algorithm === "mod36") setAlgorithm("none");
                        if (v === "alphanumeric" && algorithm === "luhn") setAlgorithm("none");
                      }}
                    >
                      <SelectTrigger><SelectValue placeholder="Choose charset" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="numeric">numeric (0–9)</SelectItem>
                        <SelectItem value="alphanumeric">alphanumeric (0–9, A–Z)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Groups</Label>
                      <Input type="number" min={1} value={groups}
                        onChange={(e) => setGroups(Math.max(1, Number(e.target.value) || 1))} />
                    </div>
                    <div className="space-y-2">
                      <Label>Group size</Label>
                      <Input type="number" min={1} value={groupSize}
                        onChange={(e) => setGroupSize(Math.max(1, Number(e.target.value) || 1))} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Formatting */}
              <Card>
                <CardHeader>
                  <CardTitle>Formatting</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Separator</Label>
                    <Input placeholder="space, - , etc" value={separator}
                           onChange={(e) => setSeparator(e.target.value)} />
                  </div>
                </CardContent>
              </Card>

              {/* Checksum */}
              <Card>
                <CardHeader>
                  <CardTitle>Checksum</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Label>Algorithm</Label>
                  <Select
                    value={algorithm}
                    onValueChange={(v: Algorithm) => setAlgorithm(v)}
                  >
                    <SelectTrigger><SelectValue placeholder="Choose algorithm" /></SelectTrigger>
                    <SelectContent>
                      {(charset === "numeric" ? ["none","luhn"] : ["none","mod36"]).map((a) => (
                        <SelectItem key={a} value={a as Algorithm}>{a}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Disable to use pure random (no checksum).</p>
                </CardContent>
              </Card>

              {/* RNG */}
              <Card>
                <CardHeader>
                  <CardTitle>Randomness</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox id="useCrypto" checked={useCrypto}
                              onCheckedChange={(b) => setUseCrypto(Boolean(b))} />
                    <Label htmlFor="useCrypto">Use Web Crypto RNG</Label>
                  </div>
                  <p className="text-xs text-muted-foreground">If disabled, falls back to Math.random().</p>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key="cards-validate"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="grid gap-4 md:grid-cols-2"
            >
              {/* Options (still relevant for validation) */}
              <Card>
                <CardHeader>
                  <CardTitle>Options</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Charset</Label>
                    <Select
                      value={charset}
                      onValueChange={(v: Charset) => {
                        setCharset(v);
                        if (v === "numeric" && algorithm === "mod36") setAlgorithm("none");
                        if (v === "alphanumeric" && algorithm === "luhn") setAlgorithm("none");
                      }}
                    >
                      <SelectTrigger><SelectValue placeholder="Choose charset" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="numeric">numeric (0–9)</SelectItem>
                        <SelectItem value="alphanumeric">alphanumeric (0–9, A–Z)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Groups</Label>
                      <Input type="number" min={1} value={groups}
                        onChange={(e) => setGroups(Math.max(1, Number(e.target.value) || 1))} />
                    </div>
                    <div className="space-y-2">
                      <Label>Group size</Label>
                      <Input type="number" min={1} value={groupSize}
                        onChange={(e) => setGroupSize(Math.max(1, Number(e.target.value) || 1))} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Checksum (still relevant for validation) */}
              <Card>
                <CardHeader>
                  <CardTitle>Checksum</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Label>Algorithm</Label>
                  <Select
                    value={algorithm}
                    onValueChange={(v: Algorithm) => setAlgorithm(v)}
                  >
                    <SelectTrigger><SelectValue placeholder="Choose algorithm" /></SelectTrigger>
                    <SelectContent>
                      {(charset === "numeric" ? ["none","luhn"] : ["none","mod36"]).map((a) => (
                        <SelectItem key={a} value={a as Algorithm}>{a}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <footer className="text-center text-xs text-muted-foreground">
          Built with React + Tailwind + shadcn/ui • Uses{" "}
          <a
            href="https://www.npmjs.com/package/structured-id"
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-2 hover:text-primary transition-colors"
            title="View structured-id on npm"
          >
            structured-id
          </a>
        </footer>
      </div>
    );
}