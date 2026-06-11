import { ethers } from "ethers";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface ProductDetails {
  name: string;
  origin: string;
  owner: string;
  created_at: string;
  event_count: number;
}

export interface TraceEvent {
  timestamp: string;
  event_type: string;
  data: string;
  recorder: string;
}

export interface Certificate {
  certType: string;
  ipfsCID: string;
  issuer: string;
  issuedDate: number;
  expiryDate: number;
  uploadedBy: string;
  uploadedAt: string;
}

export interface BatchLink {
  parent: string;
  child: string;
  type: string;
  quantity: number;
  unit: string;
  timestamp: string;
  recorder: string;
}

function formatDate(timestamp: bigint | number): string {
  const date = new Date(Number(timestamp) * 1000);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

export class TraceChain {
  public config: any;
  public abi: any;
  public provider: ethers.JsonRpcProvider;
  public contract: ethers.Contract;
  public connected: boolean = false;

  constructor() {
    try {
      const configPath = join(__dirname, "../contract_config.json");
      const abiPath = join(__dirname, "../contract_abi.json");

      this.config = JSON.parse(readFileSync(configPath, "utf-8"));
      this.abi = JSON.parse(readFileSync(abiPath, "utf-8"));

      this.provider = new ethers.JsonRpcProvider(this.config.rpc_url);
      this.contract = new ethers.Contract(
        this.config.contract_address,
        this.abi,
        this.provider
      );
      this.connected = true;
    } catch (error) {
      console.warn("Failed to initialize Blockchain connection:", error);
      this.connected = false;
      // Initialize dummies so typescript doesn't complain about uninitialized fields
      this.provider = null as any;
      this.contract = null as any;
    }
  }

  public async productExists(productId: string): Promise<boolean> {
    if (!this.connected) return false;
    try {
      return await this.contract.productExists(productId);
    } catch (e) {
      return false;
    }
  }

  public async getProduct(productId: string): Promise<ProductDetails | null> {
    if (!this.connected) return null;
    try {
      const result = await this.contract.getProduct(productId);
      return {
        name: result[0],
        origin: result[1],
        owner: result[2],
        created_at: formatDate(result[3]),
        event_count: Number(result[4]),
      };
    } catch (e) {
      return null;
    }
  }

  public async getHistory(productId: string): Promise<TraceEvent[]> {
    if (!this.connected) return [];
    try {
      const events = await this.contract.getTraceHistory(productId);
      return events.map((ev: any) => ({
        timestamp: formatDate(ev[0]),
        event_type: ev[1],
        data: ev[2],
        recorder: ev[3],
      }));
    } catch (e) {
      return [];
    }
  }

  public async getCertificates(productId: string): Promise<Certificate[]> {
    if (!this.connected) return [];
    try {
      const certs = await this.contract.getCertificates(productId);
      return certs.map((c: any) => ({
        certType: c[0],
        ipfsCID: c[1],
        issuer: c[2],
        issuedDate: Number(c[3]),
        expiryDate: Number(c[4]),
        uploadedBy: c[5],
        uploadedAt: formatDate(c[6]),
      }));
    } catch (e) {
      return [];
    }
  }

  public async getBatchLinks(batchId: string): Promise<BatchLink[]> {
    if (!this.connected) return [];
    try {
      const links = await this.contract.getBatchLinks(batchId);
      return links.map((l: any) => ({
        parent: l[0],
        child: l[1],
        type: l[2],
        quantity: Number(l[3]),
        unit: l[4],
        timestamp: formatDate(l[5]),
        recorder: l[6],
      }));
    } catch (e) {
      return [];
    }
  }

  public async getProductCount(): Promise<number> {
    if (!this.connected) return 0;
    try {
      const count = await this.contract.getProductCount();
      return Number(count);
    } catch (e) {
      return 0;
    }
  }

  public async getBalance(address: string): Promise<number> {
    if (!this.connected) return 0;
    try {
      const balance = await this.provider.getBalance(address);
      return parseFloat(ethers.formatEther(balance));
    } catch (e) {
      return 0;
    }
  }
}
