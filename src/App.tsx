import { useMemo, useState, useRef, useEffect } from "react";
import { generateId, validateId, formatId, Charset, Algorithm } from "structured-id";
import { Button } from "./components/ui/button";
import { Card, CardHeader, CardContent, CardTitle } from "./components/ui/card";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Checkbox } from "./components/ui/checkbox";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "./components/ui/select";
import { motion, AnimatePresence } from "framer-motion";

export default function App() {
    const [charset, setCharset] = useState<Charset>("numeric");
    const [algorithm, setAlgorithm] = useState<Algorithm>("none");
    const [groups, setGroups] = useState(4);
    const [groupSize, setGroupSize] = useState(4);
    const [separator, setSeparator] = useState("");
    const [useCrypto, setUseCrypto] = useState(true);

    const [id, setId] = useState("");
    const [toValidate, setToValidate] = useState("");
    const [isValid, setIsValid] = useState<boolean | null>(null);

    const [copied, setCopied] = useState<null | "raw" | "formatted">(null);
    const copyTimer = useRef<number | null>(null);

useEffect(() => {
  // Clear generated/validated state when core config changes
  setId("");
  setToValidate("");
  setIsValid(null);
  setCopied(null);
}, [charset, groups, groupSize, algorithm]);

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
        {/* Hero */}
        <header className="text-center space-y-2">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">structured-id</h1>
          <p className="text-sm text-muted-foreground">
            Generate &amp; validate structured IDs/codes with optional checksums.
          </p>
        </header>

        {/* Big display */}
        <section className="space-y-3">
          <div className="text-xs text-muted-foreground text-center">Click the code to copy</div>
          <div className="relative">
            <AnimatePresence mode="popLayout">
              <motion.pre
                key={pretty || "empty"}
                role="button"
                tabIndex={0}
                title="Click to copy"
                onClick={() => copyToClipboard(pretty, "raw")}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && copyToClipboard(pretty, "raw")}
                className="mx-auto max-w-full select-text rounded-2xl bg-secondary/70 p-5 md:p-6 text-center text-xl md:text-2xl font-mono overflow-x-auto shadow-sm cursor-pointer ring-0 hover:ring-1 ring-primary transition"
                initial={{ opacity: 0, y: -6, scale: 0.99 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.99 }}
                transition={{ duration: 0.18 }}
              >
                {pretty || "—"}
              </motion.pre>
            </AnimatePresence>
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
            <Button className="active:scale-[0.98] transition-transform" onClick={handleGenerate}>Generate</Button>
          </div>
          <p className="text-center text-xs text-muted-foreground">Total length: <b>{totalLength}</b> • Entropy: <b>{entropyBits} bits</b></p>
        </section>

        {/* Config cards */}
        <div className="grid gap-4 md:grid-cols-2">
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
                    // keep combo valid
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
        </div>

        {/* Validation */}
        <Card>
          <CardHeader>
            <CardTitle>Validate</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Label>Paste an ID (or leave blank to validate current)</Label>
            <Input
              placeholder="Paste an ID or leave blank to validate current"
              value={toValidate}
              onChange={(e) => setToValidate(e.target.value)}
            />
            <div className="flex gap-2">
              <Button variant="secondary" onClick={handleValidate}>Validate</Button>
              {isValid !== null && (
                <AnimatePresence mode="wait">
                  <motion.p
                    key={String(isValid)}
                    className={`text-sm ${isValid ? "text-green-600" : "text-red-600"}`}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    transition={{ duration: 0.15 }}
                  >
                    {isValid ? "Valid ✅" : "Invalid ❌"}
                  </motion.p>
                </AnimatePresence>
              )}
            </div>
          </CardContent>
        </Card>

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