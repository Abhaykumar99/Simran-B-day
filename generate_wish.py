import asyncio
import edge_tts

# Cute child-like voice using plain text with punctuation for pauses
# Commas (,) and ellipses (...) create natural pauses.
# Rate: slow, Pitch: high for a cute child-like effect.

PLAIN_TEXT = "Heyyyy Simran Didi! ... Happy Birthday to youuu! ... Aaj tera din hai na, toh hum chahte hain, ki tu bahut bahut khush rahe! ... Tu itni pyaari hai didi, teri smile dekh ke, sab khush ho jaate hain! ... Teri energy, teri hansi, sab kuch toh bahut awesome hai! ... Bahut sara pyar, aur dher saari khushiyaan tujhe! ... Happy Birthday Simran Didi! ... We love you so much!"

async def main():
    print("Generating cute child-like birthday wish...")
    communicate = edge_tts.Communicate(
        text=PLAIN_TEXT, 
        voice="hi-IN-SwaraNeural",
        rate="-20%",
        pitch="+20Hz"
    )
    await communicate.save("build/audio/wish.mp3")
    print("Done! Saved to build/audio/wish.mp3")

asyncio.run(main())
