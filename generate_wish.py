import asyncio
import edge_tts

# 18-year-old boy (friend) voice: natural pitch, warm slow pace. 
# Commas (,) and ellipses (...) create natural pauses.

PLAIN_TEXT = "Hey, Simraan! ... Happy Birthday to you! ... Aaj tera din hai, aur hum chahte hain, ki tujhe pata chale tu kitni special hai hamare liye. ... Teri smile, tera energy, sab kuch, we love it all! ... Bahut sara pyar, aur dher saari khushiyaan tujhe! ... Happy Birthday, Simraan! ... We love you so much!"

async def main():
    print("Generating 18-year-old boy birthday wish...")
    communicate = edge_tts.Communicate(
        text=PLAIN_TEXT, 
        voice="hi-IN-MadhurNeural",
        rate="-12%",
        pitch="+5Hz"
    )
    await communicate.save("build/audio/wish.mp3")
    print("Done! Saved to build/audio/wish.mp3")

asyncio.run(main())
