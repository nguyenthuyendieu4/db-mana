import { FormEvent, useEffect, useMemo, useState } from 'react';

type Engine = 'mysql' | 'mariadb' | 'postgresql';
type Role = 'super-admin' | 'operator' | 'read-only';

type Instance = {
  id: string;
  name: string;
  engine: Engine;
  version: string;
  status: 'running' | 'stopped' | 'warning';
  hostPort: number;
  containerPort: number;
  cpuLimit: number;
  ramLimit: number;
  storageLimit: number;
  createdAt: string;
};

type Monitoring = {
  server: {
    cpuCores: number;
    loadAverage: number;
    ramUsedPercent: number;
    ramTotalGb: number;
  };
  database: {
    connections: number;
    queriesPerSecond: number;
    transactionsPerSecond: number;
    cacheHitRate: number;
    slowQueries: number;
  };
  docker: {
    status: string;
  };
};

type Backup = {
  id: string;
  instanceId: string;
  type: 'full' | 'physical';
  source: 'manual' | 'restore';
  createdAt: string;
};

type Template = {
  id: string;
  name: string;
  engine: Engine;
  profile: string;
};

type User = {
  id: string;
  username: string;
  role: Role;
  createdAt: string;
};

type ComposePreview = {
  serviceName: string;
  yaml: string;
};

type NavKey =
  | 'Dashboard'
  | 'Database Instances'
  | 'Backup Manager'
  | 'Storage'
  | 'Monitoring'
  | 'Templates'
  | 'Logs'
  | 'Settings'
  | 'Users';

const navItems: NavKey[] = [
  'Dashboard',
  'Database Instances',
  'Backup Manager',
  'Storage',
  'Monitoring',
  'Templates',
  'Logs',
  'Settings',
  'Users',
];

const api = 'http://localhost:3000/api';

function App() {
  const [activeNav, setActiveNav] = useState<NavKey>('Database Instances');
  const [instances, setInstances] = useState<Instance[]>([]);
  const [backups, setBackups] = useState<Backup[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [monitoring, setMonitoring] = useState<Monitoring | null>(null);
  const [composePreview, setComposePreview] = useState<ComposePreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: '',
    engine: 'mysql' as Engine,
    version: '8.4',
    cpuLimit: 1,
    ramLimit: 1024,
    storageLimit: 20480,
    connectionLimit: 100,
    rootUser: 'root',
    password: 'password',
    databaseName: 'app_db',
    timezone: 'UTC',
    charset: 'utf8mb4',
    collation: 'utf8mb4_unicode_ci',
    containerPort: 3306,
    hostPort: 3306,
    bindIp: '0.0.0.0',
    whitelistIp: '0.0.0.0/0',
  });

  const versions = useMemo(() => {
    if (form.engine === 'mysql') return ['5.7', '8.0', '8.4'];
    if (form.engine === 'mariadb') return ['10.6', '10.11', '11'];
    return ['14', '15', '16', '17'];
  }, [form.engine]);

  useEffect(() => {
    void loadAll();
  }, []);

  useEffect(() => {
    const defaultVersion = versions[0];
    if (!versions.includes(form.version)) {
      setForm((prev) => ({ ...prev, version: defaultVersion }));
    }
  }, [versions, form.version]);

  async function loadAll() {
    try {
      const [instanceRes, backupRes, monitorRes, templateRes, userRes] = await Promise.all([
        fetch(`${api}/instances`),
        fetch(`${api}/backups`),
        fetch(`${api}/monitoring/overview`),
        fetch(`${api}/templates`),
        fetch(`${api}/users`),
      ]);
      const [instanceData, backupData, monitorData, templateData, userData] = await Promise.all([
        instanceRes.json(),
        backupRes.json(),
        monitorRes.json(),
        templateRes.json(),
        userRes.json(),
      ]);

      setInstances(instanceData);
      setBackups(backupData);
      setMonitoring(monitorData);
      setTemplates(templateData);
      setUsers(userData);
    } catch {
      setMessage('Không thể kết nối backend. Hãy chạy backend tại cổng 3000.');
    }
  }

  async function createInstance(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch(`${api}/instances`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const error = (await response.json()) as { message?: string };
        throw new Error(error.message ?? 'Tạo instance thất bại');
      }

      await loadAll();
      setStep(1);
      setMessage('Tạo instance thành công.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  }

  async function runAction(id: string, action: string) {
    setLoading(true);
    try {
      await fetch(`${api}/instances/${id}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      await loadAll();
    } finally {
      setLoading(false);
    }
  }

  async function deleteInstance(id: string) {
    setLoading(true);
    try {
      await fetch(`${api}/instances/${id}`, { method: 'DELETE' });
      await loadAll();
    } finally {
      setLoading(false);
    }
  }

  async function previewCompose(id: string) {
    const response = await fetch(`${api}/instances/${id}/compose`);
    const data = (await response.json()) as ComposePreview;
    setComposePreview(data);
    setActiveNav('Storage');
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex max-w-7xl gap-6 p-4 md:p-6">
        <aside className="w-64 shrink-0 rounded-2xl border border-slate-800 bg-slate-900 p-4">
          <h1 className="mb-4 text-lg font-semibold">DBStack Manager</h1>
          <ul className="space-y-1 text-sm">
            {navItems.map((item) => (
              <li key={item}>
                <button
                  type="button"
                  onClick={() => setActiveNav(item)}
                  className={`w-full rounded-lg px-3 py-2 text-left transition ${
                    activeNav === item
                      ? 'bg-emerald-500 text-slate-950'
                      : 'hover:bg-slate-800 text-slate-200'
                  }`}
                >
                  {item}
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <main className="flex-1 space-y-6">
          <header className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
            <h2 className="text-xl font-semibold">{activeNav}</h2>
            <p className="text-sm text-slate-400">Dark mode dashboard • MVP Phase 1</p>
            {message ? <p className="mt-2 text-sm text-amber-300">{message}</p> : null}
          </header>

          {(activeNav === 'Dashboard' || activeNav === 'Monitoring') && monitoring ? (
            <section className="grid gap-4 md:grid-cols-3">
              <MetricCard title="CPU Cores" value={String(monitoring.server.cpuCores)} />
              <MetricCard title="RAM Used" value={`${monitoring.server.ramUsedPercent}%`} />
              <MetricCard title="Docker" value={monitoring.docker.status} />
              <MetricCard title="Queries/s" value={String(monitoring.database.queriesPerSecond)} />
              <MetricCard title="Transactions/s" value={String(monitoring.database.transactionsPerSecond)} />
              <MetricCard title="Cache Hit" value={`${monitoring.database.cacheHitRate}%`} />
            </section>
          ) : null}

          {(activeNav === 'Database Instances' || activeNav === 'Dashboard') && (
            <>
              <section className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                <h3 className="mb-3 text-lg font-medium">Create New Database Instance Wizard (Step {step}/6)</h3>
                <form onSubmit={createInstance} className="space-y-4">
                  {step === 1 && (
                    <SelectField
                      label="Database Engine"
                      value={form.engine}
                      options={[
                        { label: 'MySQL', value: 'mysql' },
                        { label: 'MariaDB', value: 'mariadb' },
                        { label: 'PostgreSQL', value: 'postgresql' },
                      ]}
                      onChange={(value) =>
                        setForm((prev) => ({
                          ...prev,
                          engine: value as Engine,
                          containerPort: value === 'postgresql' ? 5432 : 3306,
                          hostPort: value === 'postgresql' ? 5432 : 3306,
                        }))
                      }
                    />
                  )}

                  {step === 2 && (
                    <SelectField
                      label="Version"
                      value={form.version}
                      options={versions.map((version) => ({ label: version, value: version }))}
                      onChange={(value) => setForm((prev) => ({ ...prev, version: value }))}
                    />
                  )}

                  {step === 3 && (
                    <div className="grid gap-3 md:grid-cols-2">
                      <InputField
                        label="CPU Limit"
                        value={String(form.cpuLimit)}
                        onChange={(value) => setForm((prev) => ({ ...prev, cpuLimit: Number(value) }))}
                      />
                      <InputField
                        label="RAM Limit (MB)"
                        value={String(form.ramLimit)}
                        onChange={(value) => setForm((prev) => ({ ...prev, ramLimit: Number(value) }))}
                      />
                      <InputField
                        label="Storage Limit (MB)"
                        value={String(form.storageLimit)}
                        onChange={(value) => setForm((prev) => ({ ...prev, storageLimit: Number(value) }))}
                      />
                      <InputField
                        label="Connection Limit"
                        value={String(form.connectionLimit)}
                        onChange={(value) =>
                          setForm((prev) => ({ ...prev, connectionLimit: Number(value) }))
                        }
                      />
                    </div>
                  )}

                  {step === 4 && (
                    <div className="grid gap-3 md:grid-cols-2">
                      <InputField
                        label="Instance Name"
                        value={form.name}
                        onChange={(value) => setForm((prev) => ({ ...prev, name: value }))}
                      />
                      <InputField
                        label="Root User"
                        value={form.rootUser}
                        onChange={(value) => setForm((prev) => ({ ...prev, rootUser: value }))}
                      />
                      <InputField
                        label="Password"
                        value={form.password}
                        onChange={(value) => setForm((prev) => ({ ...prev, password: value }))}
                      />
                      <InputField
                        label="Database Name"
                        value={form.databaseName}
                        onChange={(value) => setForm((prev) => ({ ...prev, databaseName: value }))}
                      />
                      <InputField
                        label="Timezone"
                        value={form.timezone}
                        onChange={(value) => setForm((prev) => ({ ...prev, timezone: value }))}
                      />
                      <InputField
                        label="Charset"
                        value={form.charset}
                        onChange={(value) => setForm((prev) => ({ ...prev, charset: value }))}
                      />
                      <InputField
                        label="Collation"
                        value={form.collation}
                        onChange={(value) => setForm((prev) => ({ ...prev, collation: value }))}
                      />
                    </div>
                  )}

                  {step === 5 && (
                    <div className="grid gap-3 md:grid-cols-2">
                      <InputField
                        label="Container Port"
                        value={String(form.containerPort)}
                        onChange={(value) =>
                          setForm((prev) => ({ ...prev, containerPort: Number(value) }))
                        }
                      />
                      <InputField
                        label="Host Port"
                        value={String(form.hostPort)}
                        onChange={(value) => setForm((prev) => ({ ...prev, hostPort: Number(value) }))}
                      />
                      <InputField
                        label="Bind IP"
                        value={form.bindIp}
                        onChange={(value) => setForm((prev) => ({ ...prev, bindIp: value }))}
                      />
                      <InputField
                        label="Whitelist IP"
                        value={form.whitelistIp}
                        onChange={(value) => setForm((prev) => ({ ...prev, whitelistIp: value }))}
                      />
                    </div>
                  )}

                  {step === 6 && (
                    <div className="rounded-lg border border-slate-700 bg-slate-950 p-3 text-sm text-slate-300">
                      <p>
                        <b>Name:</b> {form.name || '(empty)'}
                      </p>
                      <p>
                        <b>Engine/Version:</b> {form.engine} {form.version}
                      </p>
                      <p>
                        <b>Resources:</b> CPU {form.cpuLimit}, RAM {form.ramLimit}MB, Storage {form.storageLimit}MB
                      </p>
                      <p>
                        <b>Port:</b> {form.hostPort}:{form.containerPort}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="rounded-md border border-slate-700 px-3 py-2 text-sm"
                      disabled={step === 1}
                      onClick={() => setStep((prev) => Math.max(1, prev - 1))}
                    >
                      Previous
                    </button>
                    {step < 6 ? (
                      <button
                        type="button"
                        className="rounded-md bg-emerald-500 px-3 py-2 text-sm font-medium text-slate-950"
                        onClick={() => setStep((prev) => Math.min(6, prev + 1))}
                      >
                        Next
                      </button>
                    ) : (
                      <button
                        type="submit"
                        className="rounded-md bg-emerald-500 px-3 py-2 text-sm font-medium text-slate-950"
                        disabled={loading}
                      >
                        Deploy
                      </button>
                    )}
                  </div>
                </form>
              </section>

              <section className="overflow-auto rounded-2xl border border-slate-800 bg-slate-900 p-4">
                <h3 className="mb-3 text-lg font-medium">Database Instances</h3>
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-slate-400">
                      <th>Name</th>
                      <th>Engine</th>
                      <th>Status</th>
                      <th>Port</th>
                      <th>CPU</th>
                      <th>RAM</th>
                      <th>Disk</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {instances.map((instance) => (
                      <tr key={instance.id} className="border-t border-slate-800">
                        <td className="py-2">{instance.name}</td>
                        <td>{instance.engine} {instance.version}</td>
                        <td>
                          <span
                            className={`rounded px-2 py-1 text-xs ${
                              instance.status === 'running'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : instance.status === 'warning'
                                  ? 'bg-amber-500/20 text-amber-300'
                                  : 'bg-rose-500/20 text-rose-300'
                            }`}
                          >
                            {instance.status}
                          </span>
                        </td>
                        <td>{instance.hostPort}</td>
                        <td>{instance.cpuLimit}</td>
                        <td>{instance.ramLimit}MB</td>
                        <td>{instance.storageLimit}MB</td>
                        <td>
                          <div className="flex flex-wrap gap-1 py-1">
                            <ActionButton label="Start" onClick={() => void runAction(instance.id, 'start')} />
                            <ActionButton label="Stop" onClick={() => void runAction(instance.id, 'stop')} />
                            <ActionButton label="Restart" onClick={() => void runAction(instance.id, 'restart')} />
                            <ActionButton label="Backup" onClick={() => void runAction(instance.id, 'backup')} />
                            <ActionButton label="Restore" onClick={() => void runAction(instance.id, 'restore')} />
                            <ActionButton label="Clone" onClick={() => void runAction(instance.id, 'clone')} />
                            <ActionButton label="Compose" onClick={() => void previewCompose(instance.id)} />
                            <ActionButton
                              label="Delete"
                              onClick={() => void deleteInstance(instance.id)}
                              variant="danger"
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            </>
          )}

          {activeNav === 'Backup Manager' && (
            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
              <h3 className="mb-3 text-lg font-medium">Backup Manager</h3>
              <ul className="space-y-2 text-sm">
                {backups.map((backup) => (
                  <li key={backup.id} className="rounded-lg border border-slate-800 bg-slate-950 p-3">
                    Instance {backup.instanceId} • {backup.type} • {backup.source} •{' '}
                    {new Date(backup.createdAt).toLocaleString()}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {activeNav === 'Templates' && (
            <section className="grid gap-3 md:grid-cols-2">
              {templates.map((template) => (
                <article key={template.id} className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                  <h3 className="font-medium">{template.name}</h3>
                  <p className="text-sm text-slate-400">
                    Engine: {template.engine} • Profile: {template.profile}
                  </p>
                </article>
              ))}
            </section>
          )}

          {activeNav === 'Users' && (
            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
              <h3 className="mb-3 text-lg font-medium">Users / RBAC</h3>
              <ul className="space-y-2 text-sm">
                {users.map((user) => (
                  <li key={user.id} className="rounded-lg border border-slate-800 bg-slate-950 p-3">
                    {user.username} • {user.role}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {activeNav === 'Storage' && composePreview ? (
            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
              <h3 className="mb-3 text-lg font-medium">Docker Compose Preview ({composePreview.serviceName})</h3>
              <pre className="overflow-x-auto rounded-lg border border-slate-700 bg-slate-950 p-3 text-xs">
                {composePreview.yaml}
              </pre>
            </section>
          ) : null}
        </main>
      </div>
    </div>
  );
}

function MetricCard({ title, value }: { title: string; value: string }) {
  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
      <p className="text-sm text-slate-400">{title}</p>
      <p className="text-xl font-semibold">{value}</p>
    </article>
  );
}

function InputField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-slate-300">{label}</span>
      <input
        className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { label: string; value: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-slate-300">{label}</span>
      <select
        className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function ActionButton({
  label,
  onClick,
  variant,
}: {
  label: string;
  onClick: () => void;
  variant?: 'danger';
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded px-2 py-1 text-xs ${
        variant === 'danger'
          ? 'bg-rose-500/20 text-rose-300'
          : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
      }`}
    >
      {label}
    </button>
  );
}

export default App;
