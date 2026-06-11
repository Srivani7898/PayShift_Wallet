/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
import { useEffect, useState } from 'react';
import { 
  History, Search, EyeOff, Eye, ChevronLeft, ChevronRight, 
  CheckCircle2, XCircle, Clock, Trash2, ArrowUpRight, ArrowDownLeft 
} from 'lucide-react';

import { transactionService } from '../../services/api/transactionService';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { SearchBar } from '../../components/ui/SearchBar';
import { Skeleton, TransactionSkeleton } from '../../components/ui/Skeleton';
import { showToast } from '../../components/ui/Toast';

export function TransactionHistoryPage() {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Filters State
  const [search, setSearch] = useState('');
  const [type, setType] = useState('All');
  const [status, setStatus] = useState('All');
  const [sort, setSort] = useState('Latest');
  const [page, setPage] = useState(1);
  
  // Privacy State
  const [hideSensitive, setHideSensitive] = useState(false);
  
  // Receipt Modal State
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const res = await transactionService.getTransactions({
        search,
        type,
        status,
        sort,
        page,
        limit: 5
      });
      
      let items = res.transactions;
      
      // Apply privacy mask (Hide transactions >= 1000)
      if (hideSensitive) {
        items = items.filter(t => Math.abs(t.amount) < 1000);
      }
      
      setTransactions(items);
      setTotalPages(res.totalPages);
      setTotalItems(res.totalItems);
    } catch (err) {
      console.error(err);
      showToast('Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [search, type, status, sort, page, hideSensitive]);

  // Reset page when filters change
  const handleFilterChange = (filterType, val) => {
    setPage(1);
    if (filterType === 'type') setType(val);
    if (filterType === 'status') setStatus(val);
    if (filterType === 'sort') setSort(val);
  };

  const typeTabs = ['All', 'Sent', 'Received', 'UPI', 'Bill', 'Recharge', 'Refund'];

  return (
    <div className="space-y-6">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">Transaction History</h2>
          <p className="text-xs text-slate-400">View and audit ledger receipts</p>
        </div>
        
        {/* Toggle Hide Sensitive */}
        <Button
          variant={hideSensitive ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => {
            setHideSensitive(!hideSensitive);
            showToast(hideSensitive ? 'Sensitive values visible' : 'Payments above ₹1000 hidden', 'info');
          }}
          className="rounded-xl shrink-0"
        >
          {hideSensitive ? <Eye className="mr-1.5" size={16} /> : <EyeOff className="mr-1.5" size={16} />}
          {hideSensitive ? 'Show Sensitive' : 'Hide Sensitive'}
        </Button>
      </div>

      {/* Filter and Search Panel */}
      <section className="glass-panel rounded-[28px] p-5 shadow-soft space-y-4">
        <div className="grid gap-3 md:grid-cols-[1.5fr_1fr_1fr]">
          {/* Search */}
          <SearchBar 
            value={search}
            onChange={(val) => {
              setSearch(val);
              setPage(1);
            }}
            placeholder="Search by ID, payee, amount..."
          />

          {/* Status Select */}
          <label className="block">
            <select
              value={status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="h-12 w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 px-4 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 shadow-sm outline-none backdrop-blur-xl transition focus:border-brand-500"
            >
              <option value="All">Status: All</option>
              <option value="Success">Success</option>
              <option value="Pending">Pending</option>
              <option value="Failed">Failed</option>
            </select>
          </label>

          {/* Sort Select */}
          <label className="block">
            <select
              value={sort}
              onChange={(e) => handleFilterChange('sort', e.target.value)}
              className="h-12 w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 px-4 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 shadow-sm outline-none backdrop-blur-xl transition focus:border-brand-500"
            >
              <option value="Latest">Sort: Newest First</option>
              <option value="Oldest">Oldest First</option>
              <option value="Highest Amount">Highest Amount</option>
            </select>
          </label>
        </div>

        {/* Type Filter Tabs */}
        <div className="flex flex-wrap gap-1.5 rounded-2xl bg-slate-100/80 dark:bg-slate-800/80 p-1 shadow-inner overflow-x-auto scrollbar-none">
          {typeTabs.map((tab) => {
            const active = type === tab;
            return (
              <button
                key={tab}
                type="button"
                className={`rounded-xl px-4 py-2 text-xs font-black transition-all whitespace-nowrap ${
                  active
                    ? 'bg-white dark:bg-slate-900 text-brand-700 dark:text-brand-500 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-850 dark:hover:text-slate-200'
                }`}
                onClick={() => handleFilterChange('type', tab)}
              >
                {tab}
              </button>
            );
          })}
        </div>
      </section>

      {/* Transactions List */}
      <section className="glass-panel rounded-[28px] p-5 shadow-soft">
        {loading ? (
          <TransactionSkeleton />
        ) : transactions.length === 0 ? (
          <div className="py-16 text-center">
            <History className="mx-auto text-slate-300 dark:text-slate-700 mb-3" size={42} />
            <p className="text-sm font-bold text-slate-400">No transactions found</p>
            <p className="mt-1 text-xs text-slate-500">Try adjusting your filters or search query.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="divide-y divide-slate-100 dark:divide-slate-850/60">
              {transactions.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedReceipt(item)}
                  className="flex items-center justify-between gap-4 py-3.5 hover:bg-slate-50/50 dark:hover:bg-slate-900/10 rounded-2xl px-2.5 transition duration-150 cursor-pointer"
                >
                  <div className="flex min-w-0 items-center gap-3.5">
                    {/* Direction Icon indicator */}
                    <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-xs font-black ${
                      item.amount > 0 
                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-450' 
                        : 'bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}>
                      {item.amount > 0 ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                    </span>
                    
                    <div className="min-w-0">
                      <h4 className="truncate text-sm font-black text-slate-850 dark:text-slate-100">
                        {item.title}
                      </h4>
                      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-1">
                        {item.date} • {item.id} • {item.method || item.type}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className={`text-sm font-black ${item.amount > 0 ? 'text-emerald-500' : 'text-slate-900 dark:text-white'}`}>
                      {item.amount > 0 ? '+' : '-'}₹{Math.abs(item.amount).toLocaleString('en-IN')}
                    </p>
                    <div className="mt-1 flex items-center justify-end gap-1.5">
                      <Badge variant={item.status === 'Success' ? 'success' : item.status === 'Failed' ? 'failed' : 'pending'} size="sm">
                        {item.status}
                      </Badge>
                      <span className="text-[10px] font-black text-brand-700 dark:text-brand-500 hover:underline">
                        Receipt
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-850/60 pt-4 mt-2">
                <span className="text-xs font-bold text-slate-400">
                  Page {page} of {totalPages} ({totalItems} items)
                </span>
                
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="h-10 w-10 p-0 rounded-xl"
                    disabled={page === 1}
                    onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                  >
                    <ChevronLeft size={16} />
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="h-10 w-10 p-0 rounded-xl"
                    disabled={page === totalPages}
                    onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                  >
                    <ChevronRight size={16} />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* TRANSACTION RECEIPT MODAL */}
      <Modal
        isOpen={!!selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
        title="Transaction Receipt"
      >
        {selectedReceipt && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-5 text-center">
              <span className="text-xs font-bold text-slate-450 uppercase">Amount Transferred</span>
              <p className="mt-1 text-3xl font-black text-slate-950 dark:text-white">
                ₹{Math.abs(selectedReceipt.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
              
              <div className="mt-3 flex justify-center">
                <Badge variant={selectedReceipt.status === 'Success' ? 'success' : selectedReceipt.status === 'Failed' ? 'failed' : 'pending'}>
                  {selectedReceipt.status}
                </Badge>
              </div>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-850 rounded-2xl border border-slate-100 dark:border-slate-850/60 text-xs font-bold">
              <ReceiptRow label="Beneficiary / Title" value={selectedReceipt.title} />
              <ReceiptRow label="Transaction ID" value={selectedReceipt.id} />
              <ReceiptRow label="UTR / Reference ID" value={selectedReceipt.utr || `${selectedReceipt.id}-REF`} />
              <ReceiptRow label="Ledger Date" value={selectedReceipt.date} />
              <ReceiptRow label="Payment Method" value={selectedReceipt.method || selectedReceipt.type} />
              <ReceiptRow label="Source Account" value={selectedReceipt.bank || 'PayShift Wallet'} />
              <ReceiptRow label="Source Mask" value={selectedReceipt.account || 'Wallet balance'} />
              {selectedReceipt.toBank && (
                <>
                  <ReceiptRow label="Destination Bank" value={selectedReceipt.toBank} />
                  <ReceiptRow label="Destination Mask" value={selectedReceipt.toAccount} />
                </>
              )}
              <ReceiptRow label="Wallet Balance After" value={selectedReceipt.balanceAfter || 'N/A'} />
            </div>

            <div className="rounded-2xl bg-emerald-50/65 dark:bg-emerald-950/10 p-3.5 text-[11px] font-bold text-emerald-800 dark:text-emerald-450 border border-emerald-100/10">
              This digital receipt confirms the funds status on the PayShift network.
            </div>

            <Button
              className="w-full mt-4"
              onClick={() => setSelectedReceipt(null)}
            >
              Done
            </Button>
          </div>
        )}
      </Modal>

    </div>
  );
}

function ReceiptRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3 text-slate-700 dark:text-slate-350">
      <span className="text-slate-450 dark:text-slate-500 font-semibold">{label}</span>
      <span className="text-slate-850 dark:text-slate-100 text-right truncate max-w-xs">{value}</span>
    </div>
  );
}

export default TransactionHistoryPage;
