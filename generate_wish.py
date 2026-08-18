import asyncio
import edge_tts

# Short, fast, and lively Indian English (Hinglish) female voice

PLAIN_TEXT = "Hey Simrun, Happy birthday to you! Aaj tera din hai... aur tu hamare liye bahut special hai. Teri smile aur teri energy, we love it all. Bahut sara pyar aur khushiyaan tujhe. Happy birthday Simrun, we love you!"

async def main():
    print("Generating short and fast Hinglish birthday wish...")
    communicate = edge_tts.Communicate(
        text=PLAIN_TEXT, 
        voice="en-IN-NeerjaNeural",  
        rate="+15%",  # Increased speed significantly
        pitch="+4Hz"  # Lively pitch
    )
    await communicate.save("build/audio/wish.mp3")
    print("Done! Saved to build/audio/wish.mp3")

asyncio.run(main())
