/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Trophy, Gift, Landmark, Coins, ArrowRight, 
  ArrowLeft, CheckCircle2, AlertCircle, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { rewardService } from '../../services/api/rewardService';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { showToast } from '../../components/ui/Toast';

export function RewardsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  // Data States
  const [points, setPoints] = useState(0);
  const [cashback, setCashback] = useState(0);
  const [scratchCards, setScratchCards] = useState([]);
  const [history, setHistory] = useState([]);
  const [offers, setOffers] = useState([]);

  // Scratch Modal States
  const [selectedCard, setSelectedCard] = useState(null);
  const [isScratching, setIsScratching] = useState(false);
  const [scratchProgress, setScratchProgress] = useState(0); // 0 to 100
  const [revealedReward, setRevealedReward] = useState(null);

  const loadRewardsData = async () => {
    try {
      setLoading(true);
      const res = await rewardService.getRewards();
      setPoints(res.pointsBalance);
      setCashback(res.cashbackEarned);
      setScratchCards(res.scratchCards);
      setHistory(res.history);

      const offData = await rewardService.getOffers();
      setOffers(offData);
    } catch (err) {
      console.error(err);
      showToast('Failed to load rewards');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRewardsData();
  }, []);

  const handleOpenScratch = (card) => {
    if (card.scratched) return;
    setSelectedCard(card);
    setScratchProgress(0);
    setRevealedReward(null);
    setIsScratching(true);
  };

  const handleReveal = async () => {
    if (!selectedCard || revealedReward) return;
    setLoading(true);
    try {
      const res = await rewardService.scratchCard(selectedCard.id);
      
      // Update values
      setPoints(res.rewards.pointsBalance);
      setCashback(res.rewards.cashbackEarned);
      setScratchCards(res.rewards.scratchCards);
      setHistory(res.rewards.history);
      
      setRevealedReward(res.rewardReveal);
      showToast(`Revealed: ${res.rewardReveal.title}!`, 'success');
    } catch (err) {
      showToast(err.message || 'Failed to reveal reward');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse" />
          <div className="h-6 w-32 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-lg" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="h-24 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
          <div className="h-24 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
        </div>
        <div className="h-48 rounded-[28px] bg-slate-200 dark:bg-slate-800 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      
      {/* Title Header */}
      <div className="flex items-center gap-3">
        <button 
          onClick={() => navigate('/dashboard')}
          className="p-1 rounded-full border border-slate-100 dark:border-slate-800 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-500 transition shrink-0"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">Club Rewards</h2>
          <p className="text-xs text-slate-400">Earn points and scratch cards on every payment</p>
        </div>
      </div>

      {/* Rewards Overview counter widget */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="bg-gradient-to-br from-brand-500 to-indigo-600 text-white border-none shadow-md relative overflow-hidden">
          <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/10 blur-xl" />
          <CardContent className="flex items-center justify-between">
            <div className="space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-200">
                Total Cashback Earned
              </span>
              <p className="text-3xl font-black flex items-center">
                <Coins size={26} className="text-brand-accent mr-1 shrink-0" />
                ₹{cashback}
              </p>
            </div>
            <Trophy size={42} className="text-white/20" />
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white border-none shadow-md relative overflow-hidden">
          <CardContent className="flex items-center justify-between">
            <div className="space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                PayShift Club Points
              </span>
              <p className="text-3xl font-black flex items-center text-brand-500">
                <Sparkles size={24} className="mr-1 shrink-0" />
                {points}
              </p>
            </div>
            <Coins size={42} className="text-white/10" />
          </CardContent>
        </Card>
      </div>

      {/* Scratch Cards section */}
      <section className="glass-panel rounded-[28px] p-5 shadow-soft">
        <h3 className="text-base font-black text-slate-900 dark:text-slate-50 mb-1">
          Unscratched Cards
        </h3>
        <p className="text-xs text-slate-400 mb-4">Tap on a card to scratch and reveal your reward</p>
        
        {scratchCards.filter(c => !c.scratched).length === 0 ? (
          <div className="py-12 text-center rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-150 dark:border-slate-800">
            <Gift className="mx-auto text-slate-350 dark:text-slate-700 mb-2.5" size={36} />
            <p className="text-sm font-bold text-slate-500">All cards scratched!</p>
            <p className="text-xs text-slate-455 mt-0.5">Pay utility bills or send UPI transfers to earn new cards.</p>
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
            {scratchCards.filter(c => !c.scratched).map((card) => (
              <motion.div
                key={card.id}
                whileHover={{ y: -2, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleOpenScratch(card)}
                className="relative h-36 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 shadow-md cursor-pointer border border-white/20 flex flex-col items-center justify-center text-white text-center p-3 select-none"
              >
                {/* Ribbon decoration */}
                <div className="absolute top-2.5 right-2.5 bg-white/20 p-1 rounded-lg">
                  <Gift size={16} />
                </div>
                
                <span className="text-2xl">🎁</span>
                <p className="text-xs font-black uppercase tracking-wider mt-2.5 text-slate-100">
                  PayShift Reward
                </p>
                <p className="text-[10px] font-bold text-indigo-150 mt-1">Tap to scratch</p>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Active Offers Section */}
      {offers.length > 0 && (
        <section className="glass-panel rounded-[28px] p-5 shadow-soft">
          <h3 className="text-base font-black text-slate-900 dark:text-slate-50 mb-1">
            Active Club Offers
          </h3>
          <p className="text-xs text-slate-400 mb-4 font-semibold">Redeem coupons and earn bonus cashback</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {offers.map((offer) => (
              <div 
                key={offer.id} 
                className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 p-4 flex flex-col justify-between h-32"
              >
                <div>
                  <span className="text-[9px] font-black uppercase text-brand-500 tracking-wider">
                    Promo Code: {offer.code}
                  </span>
                  <h4 className="font-black text-sm text-slate-900 dark:text-slate-50 mt-1">{offer.title}</h4>
                  <p className="text-xs text-slate-450 dark:text-slate-500 mt-1 leading-snug truncate">{offer.description}</p>
                </div>
                <div className="text-xs font-black text-emerald-500 mt-2">
                  Active Reward
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Rewards History log */}
      <section className="glass-panel rounded-[28px] p-5 shadow-soft">
        <h3 className="text-base font-black text-slate-900 dark:text-slate-50 mb-4">
          Cashback Rewards History
        </h3>
        
        {history.length === 0 ? (
          <div className="py-6 text-center text-slate-400 font-bold text-xs">
            No rewards history found.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-850/60">
            {history.map((rh) => (
              <div key={rh.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-500/10 text-brand-500 text-xs shrink-0 font-black">
                    CB
                  </span>
                  <div>
                    <h4 className="text-sm font-black text-slate-850 dark:text-slate-100">{rh.title}</h4>
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-1">{rh.date}</p>
                  </div>
                </div>
                <span className="text-sm font-black text-emerald-500 shrink-0">+₹{rh.amount}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Scratch Reveal Dialog Modal */}
      <Modal
        isOpen={isScratching}
        onClose={() => setIsScratching(false)}
        title={revealedReward ? 'Congratulations!' : 'Scratch & Win!'}
        className="max-w-sm"
      >
        {selectedCard && (
          <div className="flex flex-col items-center justify-center py-6 text-center space-y-5 select-none">
            
            {/* Interactive Scratch Box */}
            <div className="relative w-56 h-56 rounded-3xl overflow-hidden bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-inner flex flex-col items-center justify-center p-4">
              
              {/* Foil Scratch Layer */}
              <AnimatePresence>
                {!revealedReward && (
                  <motion.div
                    drag
                    dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                    dragElastic={0.4}
                    onDragStart={() => {
                      setScratchProgress(prev => {
                        const next = prev + 35;
                        if (next >= 100) {
                          handleReveal();
                        }
                        return next;
                      });
                    }}
                    exit={{ y: -300, opacity: 0, rotate: -20 }}
                    transition={{ duration: 0.4 }}
                    className="absolute inset-0 bg-gradient-to-br from-slate-300 via-slate-400 to-slate-500 dark:from-slate-700 dark:via-slate-800 dark:to-slate-950 flex flex-col items-center justify-center text-white cursor-pointer z-10 p-4"
                  >
                    <span className="text-3xl animate-bounce">✨</span>
                    <p className="text-sm font-black uppercase tracking-widest mt-3">
                      Swipe Foil Card
                    </p>
                    <p className="text-[10px] font-bold text-slate-200 mt-1">Swipe/drag to reveal rewards</p>
                    
                    {/* Progress indicator */}
                    <div className="w-24 h-1.5 bg-white/20 rounded-full mt-4 overflow-hidden">
                      <div className="h-full bg-brand-500" style={{ width: `${scratchProgress}%` }} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Revealed Rewards details */}
              {revealedReward && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-center space-y-3"
                >
                  <motion.span 
                    animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5, repeatDelay: 1 }}
                    className="text-4xl block"
                  >
                    🎉
                  </motion.span>
                  <h4 className="text-2xl font-black text-slate-900 dark:text-white">
                    {revealedReward.title}
                  </h4>
                  <p className="text-xs font-bold text-slate-450 dark:text-slate-500 max-w-[180px] mx-auto leading-relaxed">
                    {revealedReward.subtitle}
                  </p>
                  
                  {revealedReward.rewardType === 'cashback' && (
                    <Badge variant="success" size="lg" className="rounded-xl mt-2 font-black">
                      Wallet Credited
                    </Badge>
                  )}
                </motion.div>
              )}
            </div>

            {revealedReward ? (
              <Button
                className="w-full max-w-[200px]"
                onClick={() => setIsScratching(false)}
              >
                Awesome!
              </Button>
            ) : (
              <Button
                variant="secondary"
                className="w-full max-w-[200px]"
                onClick={handleReveal}
              >
                Auto-Scratch Card
              </Button>
            )}
          </div>
        )}
      </Modal>

    </div>
  );
}

export default RewardsPage;
