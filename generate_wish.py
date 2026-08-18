import asyncio
import edge_tts

# Indian English (Hinglish) female voice
# Using periods and ellipses instead of exclamation marks for a softer, more intimate, and highly realistic conversational feeling.

PLAIN_TEXT = "Hey... Simrun. Happy birthday to you. Aaj na... tera din hai. Aur hum bas chahte hain ki tujhe pata chale... tu kitni special hai hamare liye. Teri smile... tera energy... sab kuch... we love it all. Bahut sara pyar, aur dher saari khushiyaan tujhe. Happy birthday... Simrun. We love you so much."

async def main():
    print("Generating highly realistic intimate Hinglish birthday wish...")
    communicate = edge_tts.Communicate(
        text=PLAIN_TEXT, 
        voice="en-IN-NeerjaNeural",  
        rate="-2%",   # Just a tiny bit relaxed
        pitch="+2Hz"  # Very natural, not overly squeaky
    )
    await communicate.save("build/audio/wish.mp3")
    print("Done! Saved to build/audio/wish.mp3")

asyncio.run(main())
