import wave
import struct
import math
import random

sample_rate = 44100.0
duration = 1.5

wavef = wave.open('assets/intro.wav', 'w')
wavef.setnchannels(1)
wavef.setsampwidth(2)
wavef.setframerate(sample_rate)

def highpass(input_sample, prev_input, prev_output, cutoff_freq, dt):
    RC = 1.0 / (2.0 * math.pi * cutoff_freq)
    alpha = RC / (RC + dt)
    return alpha * (prev_output + input_sample - prev_input)

prev_in = 0.0
prev_out = 0.0

for i in range(int(duration * sample_rate)):
    t = float(i) / sample_rate
    
    # 1. The "Starry" Chime (Multiple high-pitched harmonics)
    # Bell-like envelope (fast attack, exponential decay)
    chime_env = math.exp(-3.0 * t) if t > 0 else 0
    
    # A magical chord (Lydian/Maj7 vibes)
    freq1 = 2093.00 # C7
    freq2 = 2637.02 # E7
    freq3 = 3135.96 # G7
    freq4 = 3951.07 # B7 (Maj7)
    
    chime = (
        math.sin(2.0 * math.pi * freq1 * t) +
        0.8 * math.sin(2.0 * math.pi * freq2 * t) +
        0.6 * math.sin(2.0 * math.pi * freq3 * t) +
        0.5 * math.sin(2.0 * math.pi * freq4 * t)
    ) * 0.25 # normalize
    
    # 2. The "Cheeeech" (High-pass filtered noise shimmer)
    # Shimmer envelope (peaks slightly after start)
    shimmer_env = (t / 0.15) * math.exp(1 - (t / 0.15)) if t < 0.15 else math.exp(-3.0 * (t - 0.15))
    
    noise = random.uniform(-1.0, 1.0)
    filtered_noise = highpass(noise, prev_in, prev_out, 5000.0, 1.0/sample_rate)
    prev_in = noise
    prev_out = filtered_noise
    
    # Mix them together
    mixed = (chime * chime_env * 0.6) + (filtered_noise * shimmer_env * 1.5)
    
    # Scale to 16-bit PCM
    value = int(32767.0 * mixed)
    value = max(-32768, min(32767, value))
    
    wavef.writeframesraw(struct.pack('<h', value))

wavef.close()
print("Generated starry cheeeech!")
