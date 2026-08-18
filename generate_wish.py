import asyncio
import edge_tts

# Using en-IN-NeerjaNeural: an Indian English female voice which usually has more dynamic intonation and natural emotion for English/Hinglish than the Hindi voice.

PLAIN_TEXT = "Hey, Simran! ... Happy Birthday to you! ... Aaj tera din hai, aur hum chahte hain, ki tujhe pata chale tu kitni special hai hamare liye. ... Teri smile, tera energy, sab kuch, we love it all! ... Bahut sara pyar, aur dher saari khushiyaan tujhe! ... Happy Birthday, Simran! ... We love you so much!"

async def main():
    print("Generating expressive female birthday wish...")
    communicate = edge_tts.Communicate(
        text=PLAIN_TEXT, 
        voice="en-IN-NeerjaNeural",  # Switched to Indian English voice for better emotion
        rate="-15%",
        pitch="+5Hz"
    )
    await communicate.save("build/audio/wish.mp3")
    print("Done! Saved to build/audio/wish.mp3")

asyncio.run(main())
