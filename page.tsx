"use client";

import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";

type Address = { id: string; text: string };
type Client = { id: string; name: string; phone: string; addresses: Address[]; createdAt: number };
type SortOrder = "manual" | "name-asc" | "name-desc" | "newest" | "oldest";

const STORAGE_KEY = "cadastro-pizzaria-clientes-v1";
const makeId = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const normalize = (text: string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");

function sorted(clients: Client[], order: SortOrder) {
  const result = [...clients];
  if (order === "name-asc") result.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  if (order === "name-desc") result.sort((a, b) => b.name.localeCompare(a.name, "pt-BR"));
  if (order === "newest") result.sort((a, b) => b.createdAt - a.createdAt);
  if (order === "oldest") result.sort((a, b) => a.createdAt - b.createdAt);
  return result;
}

function CustomerCard({ client, onUpdate, onDelete, onMove, canMoveUp, canMoveDown }: {
  client: Client;
  onUpdate: (client: Client) => void;
  onDelete: () => void;
  onMove: (direction: -1 | 1) => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}) {
  const [editingDetails, setEditingDetails] = useState(false);
  const [name, setName] = useState(client.name);
  const [phone, setPhone] = useState(client.phone);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressDraft, setAddressDraft] = useState("");
  const [addingAddress, setAddingAddress] = useState(false);
  const [newAddress, setNewAddress] = useState("");

  function saveDetails(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim() || !phone.trim()) return;
    onUpdate({ ...client, name: name.trim(), phone: phone.trim() });
    setEditingDetails(false);
  }

  function saveAddress(event: FormEvent<HTMLFormElement>, addressId: string) {
    event.preventDefault();
    if (!addressDraft.trim()) return;
    onUpdate({ ...client, addresses: client.addresses.map((item) => item.id === addressId ? { ...item, text: addressDraft.trim() } : item) });
    setEditingAddressId(null);
  }

  function addAddress(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newAddress.trim()) return;
    onUpdate({ ...client, addresses: [...client.addresses, { id: makeId(), text: newAddress.trim() }] });
    setNewAddress("");
    setAddingAddress(false);
  }

  return (
    <article className="client-card">
      <div className="client-card-top">
        <div className="client-name-wrap">
          <span className="client-initial" aria-hidden="true">{client.name.trim().charAt(0).toLocaleUpperCase("pt-BR")}</span>
          <div className="client-heading"><h3>{client.name}</h3><a className="phone-link" href={`tel:${client.phone.replace(/[^+\d]/g, "")}`}>☎ {client.phone}</a></div>
        </div>
        <div className="order-controls" aria-label={`Mudar posição de ${client.name}`}>
          <button className="icon-button" type="button" onClick={() => onMove(-1)} disabled={!canMoveUp} aria-label={`Mover ${client.name} para cima`}>↑</button>
          <button className="icon-button" type="button" onClick={() => onMove(1)} disabled={!canMoveDown} aria-label={`Mover ${client.name} para baixo`}>↓</button>
        </div>
      </div>

      {editingDetails ? <form className="edit-details-form" onSubmit={saveDetails}>
        <label>Nome do cliente<input autoFocus value={name} onChange={(event) => setName(event.target.value)} required /></label>
        <label>Telefone<input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} required /></label>
        <div className="form-actions"><button className="button button-primary" type="submit">Salvar alterações</button><button className="button button-light" type="button" onClick={() => { setName(client.name); setPhone(client.phone); setEditingDetails(false); }}>Cancelar</button></div>
      </form> : <button className="text-action" type="button" onClick={() => setEditingDetails(true)}>✎ Editar nome e telefone</button>}

      <section className="addresses" aria-label={`Endereços de ${client.name}`}>
        <div className="addresses-heading"><h4>Endereços</h4><span>{client.addresses.length}</span></div>
        {client.addresses.length ? <ul>{client.addresses.map((address) => <li className="address-row" key={address.id}>
          {editingAddressId === address.id ? <form className="address-edit-form" onSubmit={(event) => saveAddress(event, address.id)}>
            <label className="sr-only" htmlFor={`address-${address.id}`}>Alterar endereço</label>
            <input id={`address-${address.id}`} autoFocus value={addressDraft} onChange={(event) => setAddressDraft(event.target.value)} required />
            <button className="button button-small button-primary" type="submit">Salvar</button><button className="button button-small button-light" type="button" onClick={() => setEditingAddressId(null)}>Cancelar</button>
          </form> : <>
            <span className="address-pin" aria-hidden="true">⌖</span><span className="address-text">{address.text}</span>
            <div className="address-actions"><button className="text-action" type="button" onClick={() => { setAddressDraft(address.text); setEditingAddressId(address.id); }}>Editar</button>
              <button className="text-action danger-text" type="button" onClick={() => { if (window.confirm("Apagar este endereço?")) onUpdate({ ...client, addresses: client.addresses.filter((item) => item.id !== address.id) }); }}>Apagar</button>
            </div>
          </>}
        </li>)}</ul> : <p className="no-address">Nenhum endereço cadastrado.</p>}
        {addingAddress ? <form className="add-address-form" onSubmit={addAddress}>
          <label htmlFor={`new-address-${client.id}`}>Novo endereço</label><textarea id={`new-address-${client.id}`} autoFocus rows={2} value={newAddress} onChange={(event) => setNewAddress(event.target.value)} placeholder="Rua, número, bairro e complemento" required />
          <div className="form-actions"><button className="button button-primary" type="submit">Salvar endereço</button><button className="button button-light" type="button" onClick={() => { setNewAddress(""); setAddingAddress(false); }}>Cancelar</button></div>
        </form> : <button className="add-address-button" type="button" onClick={() => setAddingAddress(true)}>＋ Adicionar endereço</button>}
      </section>
      <div className="client-card-footer"><span>Cadastro de cliente</span><button className="delete-client-button" type="button" onClick={() => { if (window.confirm(`Apagar ${client.name} e todos os seus endereços?`)) onDelete(); }}>Apagar cliente</button></div>
    </article>
  );
}

export default function ClientesPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<SortOrder>("manual");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) { const data: unknown = JSON.parse(saved); if (Array.isArray(data)) setClients(data as Client[]); }
    } catch { setNotice("Não foi possível abrir os cadastros salvos neste navegador."); }
    finally { setLoaded(true); }
  }, []);
  useEffect(() => {
    if (!loaded) return;
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(clients)); }
    catch { setNotice("O navegador não conseguiu salvar. Confira o espaço disponível no aparelho."); }
  }, [clients, loaded]);

  const orderedClients = useMemo(() => sorted(clients, sortOrder), [clients, sortOrder]);
  const visibleClients = useMemo(() => {
    const query = normalize(search.trim());
    if (!query) return orderedClients;
    return orderedClients.filter((client) => normalize([client.name, client.phone, ...client.addresses.map((item) => item.text)].join(" ")).includes(query));
  }, [orderedClients, search]);
  const addressCount = clients.reduce((sum, client) => sum + client.addresses.length, 0);

  function addClient(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim() || !phone.trim() || !address.trim()) return;
    setClients((current) => [{ id: makeId(), name: name.trim(), phone: phone.trim(), addresses: [{ id: makeId(), text: address.trim() }], createdAt: Date.now() }, ...current]);
    setSortOrder("manual"); setName(""); setPhone(""); setAddress("");
    setNotice("Cliente cadastrado com sucesso."); window.setTimeout(() => setNotice(""), 3500);
  }

  function moveClient(clientId: string, neighborId: string, direction: -1 | 1) {
    const result = [...orderedClients];
    const from = result.findIndex((item) => item.id === clientId);
    const neighbor = result.findIndex((item) => item.id === neighborId);
    if (from < 0 || neighbor < 0) return;
    const [moving] = result.splice(from, 1);
    const target = result.findIndex((item) => item.id === neighborId) + (direction === 1 ? 1 : 0);
    result.splice(target, 0, moving);
    setClients(result); setSortOrder("manual");
  }

  return <main className="app-shell">
    <header className="topbar">
      <a className="brand" href="/" aria-label="Voltar ao site da pizzaria"><span className="brand-icon" aria-hidden="true">🍕</span><span><b>Cadastro da Pizzaria</b><small>Clientes e endereços</small></span></a>
      <span className="saved-indicator"><span aria-hidden="true">●</span> Salvo neste aparelho</span>
    </header>
    <div className="content" id="inicio">
      <section className="welcome-panel" aria-labelledby="page-title">
        <div><p className="eyebrow">Atendimento organizado</p><h1 id="page-title">Cadastro de clientes</h1><p className="welcome-copy">Encontre um cliente rápido e mantenha telefone e endereços atualizados.</p></div>
        <div className="summary" aria-label={`${clients.length} clientes e ${addressCount} endereços`}><div><strong>{clients.length}</strong><span>Clientes</span></div><i aria-hidden="true" /><div><strong>{addressCount}</strong><span>Endereços</span></div></div>
      </section>
      <section className="form-panel" aria-labelledby="new-client-title">
        <div className="section-title"><span className="section-icon" aria-hidden="true">＋</span><div><h2 id="new-client-title">Adicionar cliente</h2><p>Preencha os dados para salvar um novo cadastro.</p></div></div>
        <form className="new-client-form" onSubmit={addClient}>
          <label>Nome do cliente<input autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Ex.: Maria da Silva" required /></label>
          <label>Telefone<input type="tel" autoComplete="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="(11) 99999-9999" required /></label>
          <label className="address-field">Endereço para entrega<textarea autoComplete="street-address" rows={2} value={address} onChange={(event) => setAddress(event.target.value)} placeholder="Rua, número, bairro e complemento" required /></label>
          <button className="button button-primary add-client-submit" type="submit"><span aria-hidden="true">＋</span> Salvar cliente</button>
        </form>
      </section>
      <section className="list-section" aria-labelledby="client-list-title">
        <div className="list-heading"><div><p className="eyebrow">Sua lista</p><h2 id="client-list-title">Clientes cadastrados</h2></div>
          <label className="sort-control">Organizar por<select value={sortOrder} onChange={(event) => setSortOrder(event.target.value as SortOrder)}><option value="manual">Minha ordem</option><option value="name-asc">Nome: A até Z</option><option value="name-desc">Nome: Z até A</option><option value="newest">Mais recentes</option><option value="oldest">Mais antigos</option></select></label>
        </div>
        <label className="search-box"><span aria-hidden="true">⌕</span><span className="sr-only">Pesquisar cliente, telefone ou endereço</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Pesquisar por nome, telefone ou endereço" />{search && <button type="button" onClick={() => setSearch("")} aria-label="Limpar pesquisa">Limpar</button>}</label>
        {notice && <p className="notice" role="status">{notice}</p>}
        {!loaded ? <div className="empty-state"><span aria-hidden="true">⌛</span><h3>Abrindo os cadastros…</h3></div> : visibleClients.length ? <div className="client-list">
          {visibleClients.map((client, index) => <CustomerCard key={client.id} client={client} onUpdate={(updated) => { setClients((current) => current.map((item) => item.id === updated.id ? updated : item)); setNotice("Cadastro atualizado."); window.setTimeout(() => setNotice(""), 3500); }} onDelete={() => setClients((current) => current.filter((item) => item.id !== client.id))} onMove={(direction) => { const neighbor = visibleClients[index + direction]; if (neighbor) moveClient(client.id, neighbor.id, direction); }} canMoveUp={index > 0} canMoveDown={index < visibleClients.length - 1} />)}
        </div> : clients.length ? <div className="empty-state"><span aria-hidden="true">⌕</span><h3>Nenhum cliente encontrado</h3><p>Tente outro nome, telefone ou endereço.</p><button className="button button-light" type="button" onClick={() => setSearch("")}>Mostrar todos</button></div> : <div className="empty-state"><span aria-hidden="true">🍕</span><h3>Sua lista está vazia</h3><p>Cadastre o primeiro cliente no formulário acima.</p></div>}
      </section>
      <aside className="privacy-note"><span aria-hidden="true">ℹ</span><p><strong>Sobre seus dados:</strong> os cadastros ficam salvos no navegador deste aparelho e não sincronizam automaticamente com outros aparelhos.</p></aside>
    </div>
    <footer className="footer"><span>Cadastro da Pizzaria</span><a href="/">Voltar ao site da pizzaria</a></footer>
  </main>;
}
