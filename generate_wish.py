import asyncio
import edge_tts

# Indian English (Hinglish) female voice: better flow and emotion for Hinglish text.
# Commas (,) and ellipses (...) create natural pauses.

PLAIN_TEXT = "Hey, Simrun! ... Happy Birthday to you! ... Aaj tera din hai, aur hum chahte hain, ki tujhe pata chale tu kitni special hai hamare liye. ... Teri smile, tera energy, sab kuch, we love it all! ... Bahut sara pyar, aur dher saari khushiyaan tujhe! ... Happy Birthday, Simrun! ... We love you so much!"

async def main():
    print("Generating Indian Hinglish female birthday wish...")
    communicate = edge_tts.Communicate(
        text=PLAIN_TEXT, 
        voice="en-IN-NeerjaNeural",  # Indian English (Hinglish) voice
        rate="+0%",  # Set back to normal conversational speed
        pitch="+5Hz"
    )
    await communicate.save("build/audio/wish.mp3")
    print("Done! Saved to build/audio/wish.mp3")

asyncio.run(main())
