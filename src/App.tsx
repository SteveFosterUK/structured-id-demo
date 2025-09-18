import { useMemo, useState, useRef } from "react";
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
    const [separator, setSeparator] = useState(" ");
    const [useCrypto, setUseCrypto] = useState(true);

    const [id, setId] = useState("");
    const [toValidate, setToValidate] = useState("");
    const [isValid, setIsValid] = useState<boolean | null>(null);

    const [copied, setCopied] = useState<null | "raw" | "formatted">(null);
    const copyTimer = useRef<number | null>(null);

    const totalLength = useMemo(() => groups * groupSize, [groups, groupSize]);
    const bitsPerChar = charset === "numeric" ? Math.log2(10) : Math.log2(36);
    const entropyBits = Math.round(bitsPerChar * totalLength);

    const algoOptions: Algorithm[] =
        charset === "numeric" ? ["none", "luhn"] : ["none", "mod36"];

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
        <div className="mx-auto max-w-4xl p-6 space-y-6">
            <header className="space-y-1">
                <h1 className="text-2xl font-semibold tracking-tight">structured-id demo</h1>
                <p className="text-sm text-muted-foreground">
                    Generate &amp; validate structured IDs/codes with optional checksums. <span className="text-xs text-muted-foreground/80">Tip: click a code block to copy.</span>
                </p>
            </header>

            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Options</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Charset */}
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

                        {/* Algorithm */}
                        <div className="space-y-2">
                            <Label>Algorithm (checksum)</Label>
                            <Select value={algorithm} onValueChange={(v: Algorithm) => setAlgorithm(v)}>
                                <SelectTrigger><SelectValue placeholder="Choose algorithm" /></SelectTrigger>
                                <SelectContent>
                                    {algoOptions.map((a) => (
                                        <SelectItem key={a} value={a}>{a}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Groups / Group Size */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Groups</Label>
                                <Input
                                    type="number"
                                    min={1}
                                    value={groups}
                                    onChange={(e) => setGroups(Math.max(1, Number(e.target.value) || 1))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Group size</Label>
                                <Input
                                    type="number"
                                    min={1}
                                    value={groupSize}
                                    onChange={(e) => setGroupSize(Math.max(1, Number(e.target.value) || 1))}
                                />
                            </div>
                        </div>

                        {/* Separator */}
                        <div className="space-y-2">
                            <Label>Separator</Label>
                            <Input
                                placeholder="space, -, etc"
                                value={separator}
                                onChange={(e) => setSeparator(e.target.value)}
                            />
                        </div>

                        {/* Web Crypto */}
                        <div className="flex items-center gap-2">
                            <Checkbox
                                id="useCrypto"
                                checked={useCrypto}
                                onCheckedChange={(b) => setUseCrypto(Boolean(b))}
                            />
                            <Label htmlFor="useCrypto">Use Web Crypto RNG</Label>
                        </div>

                        <p className="text-xs text-muted-foreground">
                            Total length: <b>{totalLength}</b> • Entropy: <b>{entropyBits} bits</b>
                        </p>

                        <Button
                            className="active:scale-[0.98] transition-transform"
                            onClick={handleGenerate}
                        >
                            Generate
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Result & Validation</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div>
                            <div className="text-xs text-muted-foreground mb-1">Raw</div>
                            <div className="relative group">
                                <pre
                                  role="button"
                                  tabIndex={0}
                                  title="Click to copy"
                                  onClick={() => copyToClipboard(id, "raw")}
                                  onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && copyToClipboard(id, "raw")}
                                  className="rounded bg-secondary p-2 text-sm overflow-x-auto cursor-pointer ring-0 group-hover:ring-1 ring-primary transition"
                                >
                                  {id || "—"}
                                </pre>
                                <AnimatePresence>
                                  {copied === "raw" && (
                                    <motion.span
                                      key="copied-raw"
                                      aria-live="polite"
                                      className="absolute top-1 right-1 rounded bg-black/80 text-white text-xs px-2 py-0.5 shadow-sm"
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
                        </div>
                        <div>
                            <div className="text-xs text-muted-foreground mb-1">Formatted</div>
                            <div className="relative group">
                                <pre
                                  role="button"
                                  tabIndex={0}
                                  title="Click to copy"
                                  onClick={() => copyToClipboard(pretty, "formatted")}
                                  onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && copyToClipboard(pretty, "formatted")}
                                  className="rounded bg-secondary p-2 text-sm overflow-x-auto cursor-pointer ring-0 group-hover:ring-1 ring-primary transition"
                                >
                                  {pretty || "—"}
                                </pre>
                                <AnimatePresence>
                                  {copied === "formatted" && (
                                    <motion.span
                                      key="copied-formatted"
                                      aria-live="polite"
                                      className="absolute top-1 right-1 rounded bg-black/80 text-white text-xs px-2 py-0.5 shadow-sm"
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
                        </div>

                        <div className="h-px bg-border" />

                        <div className="space-y-2">
                            <Label>Validate</Label>
                            <Input
                                placeholder="Paste an ID or leave blank to validate current"
                                value={toValidate}
                                onChange={(e) => setToValidate(e.target.value)}
                            />
                            <Button variant="secondary" onClick={handleValidate}>
                                Validate
                            </Button>
                            {isValid !== null && (
                                <p className={`text-sm ${isValid ? "text-green-600" : "text-red-600"}`}>
                                    {isValid ? "Valid ✅" : "Invalid ❌"}
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <footer className="text-xs text-muted-foreground">
                Built with React + Tailwind + shadcn/ui • Uses <code>structured-id</code>
            </footer>
        </div>
    );
}