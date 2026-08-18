import asyncio
import edge_tts

# Sweet, warm female voice (Indian Hindi): natural pitch, warm slow pace. 
# Commas (,) and ellipses (...) create natural pauses.

PLAIN_TEXT = "Hey, Simran! ... Happy Birthday to you! ... Aaj tera din hai, aur hum chahte hain, ki tujhe pata chale tu kitni special hai hamare liye. ... Teri smile, tera energy, sab kuch, we love it all! ... Bahut sara pyar, aur dher saari khushiyaan tujhe! ... Happy Birthday, Simran! ... We love you so much!"

async def main():
    print("Generating Indian Hindi female birthday wish...")
    communicate = edge_tts.Communicate(
        text=PLAIN_TEXT, 
        voice="hi-IN-SwaraNeural",  # Back to Indian Hindi voice
        rate="-15%",
        pitch="+8Hz"
    )
    await communicate.save("build/audio/wish.mp3")
    print("Done! Saved to build/audio/wish.mp3")

asyncio.run(main())
