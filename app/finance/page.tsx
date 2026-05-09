import { SectionTitle } from "@/components/SectionCard";
import { WalletBoard } from "@/components/wallet/WalletBoard";

export default function FinancePage() {
  return (
    <div className="space-y-4 pt-1">
      <SectionTitle>Wallet</SectionTitle>
      <WalletBoard />
    </div>
  );
}
