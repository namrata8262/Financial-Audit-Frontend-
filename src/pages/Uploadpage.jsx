import { useRef, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  FileSpreadsheet,
  FileUp,
  ShieldCheck,
  Trash2,
  AlertCircle,
  Play,
  LoaderCircle,
  Users,
  Landmark,
  GitCompare,
  CreditCard,
  Download,
} from "lucide-react";

const API_URL = "http://127.0.0.1:8000";

const datasets = [
  {
    key: "beneficiaries",
    title: "Beneficiary Records",
    description: "Identity, contact, and scheme information",
    expected: ["beneficiary_id", "beneficiary_name", "date_of_birth"],
  },
  {
    key: "accounts",
    title: "Bank Accounts",
    description: "Beneficiary-to-account mappings",
    expected: ["beneficiary_id", "account_id"],
  },
  {
    key: "disbursements",
    title: "Disbursement Records",
    description: "Payments and transaction history",
    expected: ["transaction_id", "beneficiary_id", "account_id", "amount"],
  },
];

function parseCsvHeader(text) {
  const firstLine = text.split(/\r?\n/, 1)[0];
  const headers = [];
  let value = "";
  let quoted = false;

  for (let i = 0; i < firstLine.length; i++) {
    const char = firstLine[i];

    if (char === '"') {
      if (quoted && firstLine[i + 1] === '"') {
        value += '"';
        i++;
      } else {
        quoted = !quoted;
      }
    } else if (char === "," && !quoted) {
      headers.push(value.trim().replace(/^\uFEFF/, "").toLowerCase());
      value = "";
    } else {
      value += char;
    }
  }

  headers.push(value.trim().replace(/^\uFEFF/, "").toLowerCase());
  return headers;
}

export default function UploadPage({ onAuditComplete }) {
  const [files, setFiles] = useState({});
  const [errors, setErrors] = useState({});
  const [dragging, setDragging] = useState("");
  const [validating, setValidating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [validationResults, setValidationResults] = useState({});
  const [auditResults, setAuditResults] = useState(null);
  const [auditId, setAuditId] = useState("");
  const inputRefs = useRef({});

  function selectFile(key, file) {
    if (!file) return;

    setMessage("");
    setAuditResults(null);
    setAuditId("");
    setValidationResults({});

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setErrors((old) => ({ ...old, [key]: "Please select a CSV file." }));
      return;
    }

    if (file.size === 0) {
      setErrors((old) => ({ ...old, [key]: "The file is empty." }));
      return;
    }

    setFiles((old) => ({ ...old, [key]: file }));
    setErrors((old) => ({ ...old, [key]: "" }));
  }

  function removeFile(key) {
    setFiles((old) => {
      const next = { ...old };
      delete next[key];
      return next;
    });

    setErrors((old) => ({ ...old, [key]: "" }));
    setValidationResults({});
    setAuditResults(null);
    setAuditId("");
    setMessage("");

    if (inputRefs.current[key]) {
      inputRefs.current[key].value = "";
    }
  }

  async function validateDatasets() {
    setMessage("");
    setValidationResults({});
    setAuditResults(null);

    const missing = datasets.filter((item) => !files[item.key]);

    if (missing.length) {
      setMessage(
        `Please select all three CSV files. Missing: ${missing
          .map((item) => item.title)
          .join(", ")}.`
      );
      return false;
    }

    setValidating(true);

    try {
      const results = {};

      for (const dataset of datasets) {
        const text = await files[dataset.key].text();
        const headers = parseCsvHeader(text);

        const missingColumns = dataset.expected.filter(
          (column) => !headers.includes(column)
        );

        results[dataset.key] = {
          valid: missingColumns.length === 0,
          missingColumns,
          fileName: files[dataset.key].name,
        };
      }

      setValidationResults(results);

      const failed = datasets.filter(
        (dataset) => !results[dataset.key].valid
      );

      if (failed.length) {
        setMessage(
          "Some required columns are missing. Correct the CSV headers before running the audit."
        );
      } else {
        setMessage(
          "All three CSV files passed header validation. You can now run the audit."
        );
      }

      return failed.length === 0;
    } catch {
      setMessage("Unable to read one or more files. Please select them again.");
      return false;
    } finally {
      setValidating(false);
    }
  }

  async function runAudit() {
    if (uploading || validating) return;

    setMessage("");
    setAuditResults(null);
    setAuditId("");

    const headersValid = await validateDatasets();

    if (!headersValid) return;

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("beneficiaries_file", files.beneficiaries);
      formData.append("bank_accounts_file", files.accounts);
      formData.append("disbursements_file", files.disbursements);

      const response = await fetch(`${API_URL}/audit/run`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : JSON.stringify(data.detail || "Audit failed.")
        );
      }

      setAuditResults(data.results);
      setAuditId(data.audit_id || "");

      if (onAuditComplete) {
        onAuditComplete(data.results);
      }

      setMessage("Audit completed successfully.");
    } catch (error) {
      setMessage(
        `Audit failed: ${error.message}. Check that the FastAPI backend is running at ${API_URL}.`
      );
    } finally {
      setUploading(false);
    }
  }

  function downloadJson() {
    if (!auditResults) return;

    const blob = new Blob(
      [JSON.stringify({ audit_id: auditId, results: auditResults }, null, 2)],
      { type: "application/json" }
    );

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `audit-results-${auditId || "latest"}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  const selectedCount = datasets.filter((item) => files[item.key]).length;
  const summary = auditResults?.summary;

  return (
    <div className="min-h-screen bg-slate-950 p-5 text-slate-100 md:p-8">
      <div className="mx-auto max-w-5xl">
        <button
          onClick={() => window.history.back()}
          className="mb-6 flex items-center gap-2 text-sm text-slate-400 hover:text-white"
        >
          <ArrowLeft size={17} />
          Back
        </button>

        <div className="mb-8 flex items-start gap-4">
          <div className="rounded-xl bg-blue-500/15 p-3 text-blue-400">
            <FileUp size={27} />
          </div>

          <div>
            <p className="text-sm text-blue-400">AUDITX / Data Management</p>
            <h1 className="mt-2 text-2xl font-bold md:text-3xl">
              Upload Audit Datasets
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              Select beneficiary, bank account, and disbursement CSV files
              to run your financial audit.
            </p>
          </div>
        </div>

        <div className="mb-6 flex gap-3 rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
          <ShieldCheck
            className="mt-0.5 shrink-0 text-blue-400"
            size={21}
          />
          <div>
            <p className="text-sm font-medium">Audit API integration</p>
            <p className="mt-1 text-xs leading-5 text-slate-400">
              Files are checked in your browser and then sent to your local
              FastAPI backend when you run the audit.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {datasets.map((dataset, index) => {
            const file = files[dataset.key];
            const error = errors[dataset.key];
            const result = validationResults[dataset.key];

            return (
              <div
                key={dataset.key}
                className="rounded-2xl border border-slate-800 bg-slate-900 p-5 md:p-6"
              >
                <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-slate-800 p-2 text-blue-400">
                      <FileSpreadsheet size={22} />
                    </div>
                    <div>
                      <h2 className="font-semibold">
                        {index + 1}. {dataset.title}
                      </h2>
                      <p className="mt-1 text-sm text-slate-400">
                        {dataset.description}
                      </p>
                    </div>
                  </div>

                  {result && (
                    <span
                      className={`rounded-full px-3 py-1 text-xs ${
                        result.valid
                          ? "bg-emerald-500/10 text-emerald-300"
                          : "bg-red-500/10 text-red-300"
                      }`}
                    >
                      {result.valid ? "Headers valid" : "Check columns"}
                    </span>
                  )}
                </div>

                <input
                  ref={(element) => {
                    inputRefs.current[dataset.key] = element;
                  }}
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={(event) =>
                    selectFile(dataset.key, event.target.files?.[0])
                  }
                />

                {file ? (
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-700 bg-slate-950 p-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <CheckCircle2
                        className="shrink-0 text-emerald-400"
                        size={22}
                      />
                      <div className="min-w-0">
                        <p className="break-all text-sm font-medium">
                          {file.name}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {(file.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => removeFile(dataset.key)}
                      disabled={uploading}
                      className="flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 disabled:opacity-50"
                    >
                      <Trash2 size={15} />
                      Remove
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => inputRefs.current[dataset.key]?.click()}
                    onDragOver={(event) => {
                      event.preventDefault();
                    }}
                    onDrop={(event) => {
                      event.preventDefault();
                      selectFile(dataset.key, event.dataTransfer.files?.[0]);
                    }}
                    className="flex w-full flex-col items-center rounded-xl border border-dashed border-slate-700 p-7 text-center transition hover:border-blue-500 hover:bg-slate-800/50"
                  >
                    <FileUp className="mb-3 text-slate-400" size={27} />
                    <span className="text-sm font-medium">
                      Click to browse or drag a CSV file here
                    </span>
                    <span className="mt-2 text-xs text-slate-500">
                      CSV format only
                    </span>
                  </button>
                )}

                {error && (
                  <p className="mt-3 flex items-center gap-2 text-xs text-red-400">
                    <AlertCircle size={15} />
                    {error}
                  </p>
                )}

                {result && !result.valid && (
                  <p className="mt-3 text-xs leading-5 text-red-300">
                    Missing required columns: {result.missingColumns.join(", ")}
                  </p>
                )}

                <p className="mt-3 text-xs leading-5 text-slate-500">
                  Required columns: {dataset.expected.join(", ")}
                </p>
              </div>
            );
          })}
        </div>

        {message && (
          <div
            className={`mt-5 rounded-xl border p-4 text-sm leading-6 ${
              message.toLowerCase().includes("failed") ||
              message.toLowerCase().includes("missing") ||
              message.toLowerCase().includes("unable")
                ? "border-red-500/30 bg-red-500/5 text-red-300"
                : "border-slate-700 bg-slate-900 text-slate-300"
            }`}
          >
            {message}
          </div>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <div>
            <p className="font-medium">{selectedCount} of 3 datasets selected</p>
            <p className="mt-1 text-xs text-slate-500">
              Validate the required columns before running the audit.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={validateDatasets}
              disabled={validating || uploading}
              className="rounded-xl border border-slate-700 px-4 py-3 text-sm font-semibold text-slate-200 hover:bg-slate-800 disabled:opacity-50"
            >
              {validating ? "Validating..." : "Validate datasets"}
            </button>

            <button
              onClick={runAudit}
              disabled={validating || uploading || selectedCount !== 3}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {uploading ? (
                <LoaderCircle className="animate-spin" size={17} />
              ) : (
                <Play size={17} />
              )}
              {uploading ? "Running audit..." : "Run Audit"}
            </button>
          </div>
        </div>

        {auditResults && (
          <section className="mt-8">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm text-emerald-400">
                  <CheckCircle2 className="mr-2 inline" size={17} />
                  Audit completed
                </p>
                <h2 className="mt-2 text-2xl font-bold">Audit Results</h2>
                {auditId && (
                  <p className="mt-1 break-all text-xs text-slate-500">
                    Audit ID: {auditId}
                  </p>
                )}
              </div>

              <button
                onClick={downloadJson}
                className="flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-3 text-sm hover:bg-slate-800"
              >
                <Download size={17} />
                Export JSON
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                {
                  label: "Beneficiaries",
                  value: summary?.beneficiaries ?? 0,
                  icon: Users,
                },
                {
                  label: "Shared Accounts",
                  value: summary?.shared_accounts ?? 0,
                  icon: Landmark,
                },
                {
                  label: "Potential Duplicate Pairs",
                  value: summary?.potential_duplicate_pairs ?? 0,
                  icon: GitCompare,
                },
                {
                  label: "Transactions",
                  value: summary?.transactions ?? 0,
                  icon: CreditCard,
                },
              ].map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-slate-800 bg-slate-900 p-5"
                  >
                    <Icon className="mb-4 text-blue-400" size={22} />
                    <p className="text-2xl font-bold">
                      {Number(item.value).toLocaleString()}
                    </p>
                    <p className="mt-2 text-sm text-slate-400">
                      {item.label}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <h3 className="mb-3 font-semibold">Review Evidence</h3>
              <p className="mb-4 text-sm text-slate-400">
                These matches are investigation leads, not proof of fraud.
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-700 text-slate-400">
                    <tr>
                      <th className="px-3 py-3">Beneficiary 1</th>
                      <th className="px-3 py-3">Beneficiary 2</th>
                      <th className="px-3 py-3">Similarity</th>
                      <th className="px-3 py-3">Same DOB</th>
                      <th className="px-3 py-3">Shared account</th>
                      <th className="px-3 py-3">Score</th>
                    </tr>
                  </thead>

                  <tbody>
                    {(auditResults.review_pairs || [])
                      .slice(0, 50)
                      .map((row, index) => (
                        <tr
                          key={`${row.beneficiary_1}-${row.beneficiary_2}-${index}`}
                          className="border-b border-slate-800 last:border-0"
                        >
                          <td className="px-3 py-3">
                            {row.beneficiary_1 || "—"}
                            {row.name_1 ? ` · ${row.name_1}` : ""}
                          </td>
                          <td className="px-3 py-3">
                            {row.beneficiary_2 || "—"}
                            {row.name_2 ? ` · ${row.name_2}` : ""}
                          </td>
                          <td className="px-3 py-3">
                            {row.name_similarity == null
                              ? "—"
                              : `${Number(row.name_similarity).toFixed(1)}%`}
                          </td>
                          <td className="px-3 py-3">
                            {row.same_dob == null
                              ? "—"
                              : row.same_dob
                                ? "Yes"
                                : "No"}
                          </td>
                          <td className="px-3 py-3">
                            {row.shared_account || "—"}
                          </td>
                          <td className="px-3 py-3">
                            {row.risk_score ?? "—"}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              {(auditResults.review_pairs || []).length > 50 && (
                <p className="mt-3 text-xs text-slate-500">
                  Showing the first 50 of {auditResults.review_pairs.length} pairs.
                  Export JSON to review all results.
                </p>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}