import urllib.request
import os
import subprocess
import time

ASSETS_DIR = "src/assets"
if not os.path.exists(ASSETS_DIR):
    os.makedirs(ASSETS_DIR)

# Pollinations API (text endpoint sometimes redirects to image better)
# https://pollinations.ai/p/{prompt}?width={width}&height={height}&nologo=true
# Or using unauthenticated huggingface API for images if possible, but let's stick to pollinations image prompt endpoint which is meant for this.
# A small trick is to append a random string to the prompt to bypass caching 502s.

prompts = {
    "castle1.png": "A simple wooden fort in a green forest, 2d game art, side view, fantasy style, clean background, high resolution, isolated on black background, game asset",
    "castle2.png": "A sturdy stone castle with a red roof, 2d game art, side view, fantasy style, clean background, high resolution, isolated on black background, game asset",
    "castle3.png": "A majestic crystal palace glowing with magic, 2d game art, side view, fantasy style, clean background, high resolution, isolated on black background, game asset",
    "princess.png": "A cute anime style warrior princess holding a magic wand, 2d game sprite, side view, clean background, isolated on black background, full body, game asset",
    "enemy1.png": "A cute but angry green slime monster, 2d game sprite, side view, fantasy style, clean background, isolated on black background, game asset",
    "enemy2.png": "A flying bat monster with glowing red eyes, 2d game sprite, side view, fantasy style, clean background, isolated on black background, game asset",
    "enemy3.png": "A stone golem monster, 2d game sprite, side view, fantasy style, clean background, isolated on black background, game asset",
    "boss.png": "A huge scary red dragon monster, 2d game sprite boss, side view, fantasy style, clean background, isolated on black background, game asset",
    "projectile.png": "A glowing magical blue fireball, 2d game sprite, flying forward, clean background, isolated on black background, game asset",
    "unicorn.png": "A beautiful white unicorn with a glowing horn, 2d game sprite, side view, clean background, isolated on black background, game asset"
}

def generate_image(filename, prompt, width=512, height=512, do_rembg=True):
    print(f"Generating {filename}...")
    import urllib.parse

    # Adding timestamp to prompt to force new generation
    prompt_with_cache_buster = prompt + f" {int(time.time()*1000)}"
    encoded_prompt = urllib.parse.quote(prompt_with_cache_buster)

    url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?width={width}&height={height}&nologo=true"

    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})

    temp_file = f"temp_{filename}"

    max_retries = 3
    success = False
    for attempt in range(max_retries):
        try:
            with urllib.request.urlopen(req) as response, open(temp_file, 'wb') as out_file:
                out_file.write(response.read())
            success = True
            break
        except Exception as e:
            print(f"Attempt {attempt + 1} failed: {e}")
            time.sleep(2)

    if not success:
        print("Using fallback image...")
        fallback_url = f"https://picsum.photos/{width}/{height}"
        urllib.request.urlretrieve(fallback_url, temp_file)

    if do_rembg:
        print(f"Removing background from {filename}...")
        final_path = os.path.join(ASSETS_DIR, filename)
        # using the python rembg library directly if CLI fails
        try:
            import rembg
            with open(temp_file, 'rb') as i:
                with open(final_path, 'wb') as o:
                    input_data = i.read()
                    output_data = rembg.remove(input_data)
                    o.write(output_data)
        except Exception as e:
            print(f"Rembg failed: {e}, falling back to CLI")
            subprocess.run(["rembg", "i", temp_file, final_path], check=True)
        os.remove(temp_file)
    else:
        final_path = os.path.join(ASSETS_DIR, filename)
        os.rename(temp_file, final_path)
    print(f"Saved {final_path}")

for filename, prompt in prompts.items():
    generate_image(filename, prompt, 512, 512, True)

print("All assets generated!")
