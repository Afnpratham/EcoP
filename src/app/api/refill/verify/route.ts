import { receiveDeviceEvent } from "@/lib/device-gateway";
export const runtime = "nodejs";
export async function POST(request: Request) {
  return receiveDeviceEvent(request, "refill");
}
