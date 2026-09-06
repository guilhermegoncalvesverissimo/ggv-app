import { WalletBoard } from "@/components/wallet/WalletBoard";

export default function FinancePage() {
  // No SectionTitle here: the lime tile at the top of WalletTiles is the
  // heading, the same way the reference layout's wide card carries the title.
  return (
    <div className="space-y-4 pt-1">
      <WalletBoard />
    </div>
  );
}
