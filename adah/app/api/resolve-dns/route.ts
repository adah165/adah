import { NextResponse } from "next/server"
import dns from "dns"
import fs from "fs"
import path from "path"

export async function GET(): Promise<NextResponse> {
  return new Promise<NextResponse>((resolve) => {
    dns.resolveCname("db.zsjfagvmscmnxqycudqv.supabase.co", (err, addresses) => {
      const resultFile = path.join(process.cwd(), "dns_result.json")
      if (err) {
        dns.lookup("db.zsjfagvmscmnxqycudqv.supabase.co", (lookupErr, address) => {
          if (lookupErr) {
            fs.writeFileSync(resultFile, JSON.stringify({ error: lookupErr.message }))
            resolve(NextResponse.json({ error: lookupErr.message }))
          } else {
            fs.writeFileSync(resultFile, JSON.stringify({ address, addresses: [] }))
            resolve(NextResponse.json({ address, addresses: [] }))
          }
        })
      } else {
        fs.writeFileSync(resultFile, JSON.stringify({ addresses }))
        resolve(NextResponse.json({ addresses }))
      }
    })
  })
}
