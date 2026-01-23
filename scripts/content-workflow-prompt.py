#!/usr/bin/env python3
"""
Content Workflow v3 Interactive Prompt
Guides you through the 7-step workflow to build a caption skeleton.
"""

import sys
from datetime import datetime
from pathlib import Path


def print_step_header(step_num, step_name):
    """Print a formatted step header."""
    print(f"\n{'='*60}")
    print(f"STEP {step_num}: {step_name}")
    print(f"{'='*60}\n")


def get_input(prompt, required=True, validation_func=None):
    """Get user input with optional validation."""
    while True:
        response = input(prompt).strip()
        if not response and required:
            print("This field is required. Please provide an answer.")
            continue
        if validation_func and not validation_func(response):
            continue
        return response


def validate_voice(response):
    """Validate voice selection."""
    valid_voices = ['titan pmr', 'titanverse', 'intersection', 'titan', 'pmr']
    if response.lower() not in valid_voices:
        print(f"Please choose: Titan PMR, Titanverse, or Intersection")
        return False
    return True


def validate_format(response):
    """Validate format selection."""
    valid_formats = ['carousel', 'single', 'video', 'single image', 'single-image']
    if response.lower() not in valid_formats:
        print(f"Please choose: Carousel, Single, or Video")
        return False
    return True


def validate_node_type(response):
    """Validate node type selection."""
    valid_types = ['system role', 'human state', 'failure mode', 'operating shift', 
                   'role', 'state', 'failure', 'shift']
    if response.lower() not in valid_types:
        print(f"Please choose: System role, Human state, Failure mode, or Operating shift")
        return False
    return True


def validate_hook_has_requirement(response):
    """Check if hook contains number, name, or contrast."""
    has_number = any(char.isdigit() for char in response)
    has_name = any(word[0].isupper() and len(word) > 2 for word in response.split())
    has_contrast = any(word.lower() in ['from', 'to', 'no', 'without', 'vs', 'versus'] 
                      for word in response.split())
    
    if not (has_number or has_name or has_contrast):
        print("⚠️  Warning: Hook should contain a number, name, or sharp contrast.")
        print("   Examples: '16,000 items', 'Prab was ready', 'From 4,000 to 17,000'")
        confirm = input("Continue anyway? (y/n): ").strip().lower()
        if confirm != 'y':
            return False
    return True


def main():
    """Run the interactive content workflow prompt."""
    print("\n" + "="*60)
    print("CONTENT WORKFLOW v3 - Interactive Prompt")
    print("From TITAN x TITANVERSE model to actual posts")
    print("="*60)
    
    responses = {}
    
    # STEP 1: Voice & Format
    print_step_header(1, "Voice & Format")
    print("Decide which product world you are in and how this story should be told.")
    print("\nIs this mainly a dispensing story (Titan PMR), a services story")
    print("(Titanverse), or the bridge between them?")
    
    voice = get_input("\nVoice (Titan PMR / Titanverse / Intersection): ", 
                     validation_func=validate_voice)
    responses['voice'] = voice.title()
    
    print("\nFormat rule of thumb:")
    print("  • Carousel: Transformation, before/after, or multi-step logic")
    print("  • Single image: One sharp idea or blunt position")
    print("  • Video: Named person, emotional or visual journey")
    
    format_choice = get_input("\nFormat (Carousel / Single / Video): ",
                            validation_func=validate_format)
    responses['format'] = format_choice.title()
    
    # STEP 2: Pick the Node
    print_step_header(2, "Pick the Node")
    print("Choose one element from the systems model to anchor the post.")
    print("\nWhich single thing are you really talking about?")
    print("\nOptions:")
    print("  • System role: pharmacist at bench, pharmacist in clinic, dispenser, owner")
    print("  • Human state: calm, overloaded, trapped, ambitious")
    print("  • Failure mode: manual checking, baskets stacking up, no time for services")
    print("  • Operating shift: items → services, bench → clinic, chaos → calm")
    
    node_type = get_input("\nNode type (System role / Human state / Failure mode / Operating shift): ",
                         validation_func=validate_node_type)
    responses['node_type'] = node_type.title()
    
    node_description = get_input("Describe the specific node: ")
    responses['node'] = node_description
    
    # STEP 3: Write the Hook
    print_step_header(3, "Write the Hook")
    print("Open with a line that creates curiosity or contrast, anchored in reality.")
    print("\nWhat first line would make a tired pharmacist stop scrolling?")
    print("\nRules:")
    print("  • First line must contain either a number, a name, or a direct contrast")
    print("  • No soft intros. No scene-setting. Hit straight away.")
    print("\nExamples:")
    print("  • Number: '16,000 items a month. No chaos.'")
    print("  • Named person: 'Five years ago, Prab was ready to leave pharmacy.'")
    print("  • Contrast: 'From 4,000 items to 17,000. No extra staff.'")
    print("  • Blunt truth: 'Dispensing alone will not pay the bills.'")
    
    hook = get_input("\nHook (first line): ",
                    validation_func=validate_hook_has_requirement)
    responses['hook'] = hook
    
    # STEP 4: Name the Failure
    print_step_header(4, "Name the Failure")
    print("State what is actually broken, using concrete nouns.")
    print("\nWhat specific thing is making life impossible here?")
    print("\nRules:")
    print("  • Talk about baskets, scripts, hours, rooms, not 'efficiency' or 'challenges'")
    print("  • One primary failure per post")
    print("\nExamples:")
    print("  • 'Baskets stacking up.'")
    print("  • 'Pharmacists checking 100% of scripts manually.'")
    print("  • '80% of the day stuck at the bench.'")
    print("  • 'Services squeezed out by dispensing.'")
    
    failure = get_input("\nFailure (concrete problem): ")
    responses['failure'] = failure
    
    # STEP 5: Quantify the Cost
    print_step_header(5, "Quantify the Cost")
    print("Put a number on the pain: time, stress, money, or opportunity.")
    print("\nIf they ignored this problem for a year, what would it cost?")
    print("\nRule: at least one real number or one very clear 'before' state.")
    print("\nExamples:")
    print("  • Time: '20 pharmacist hours a week at the bench.'")
    print("  • Safety: 'Five or six near misses every month.'")
    print("  • Opportunity: 'No time left for clinics.'")
    print("  • Emotional: 'Ready to leave the profession.'")
    
    cost = get_input("\nCost (quantified pain): ")
    responses['cost'] = cost
    
    # STEP 6: Show Why It Cannot Continue
    print_step_header(6, "Show Why It Cannot Continue")
    print("Make the consequence feel inevitable, not optional.")
    print("\nWhat breaks if they keep going like this?")
    print("\nLanguage pattern: cannot / will not / fast track to, not 'might struggle'")
    print("\nExamples:")
    print("  • 'This is a fast track to burnout.'")
    print("  • 'Dispensing alone will not sustain this business.'")
    print("  • 'You cannot bolt clinical care onto firefighting.'")
    print("  • 'Scaling items like this just scales risk.'")
    
    unsustainable = get_input("\nUnsustainability (inevitable consequence): ")
    responses['unsustainable'] = unsustainable
    
    # STEP 7: Show the Fix, Prove It, Point Forwards
    print_step_header(7, "Show the Fix, Prove It, Point Forwards")
    print("Shift the node, show how the system changes, and prove it with a named example.")
    print("\nWhat does 'after' look like, and who has already done it?")
    print("\nRules:")
    print("  • Always include at least one named person and one concrete outcome")
    print("  • End on what this makes possible next (services, growth, headspace)")
    print("\nExamples:")
    print("  • Fix: 'AI clears low-risk scripts so pharmacists step off the bench.'")
    print("  • Proof: 'Prab now runs 16,000 items a month with no overtime.'")
    print("  • Forward motion: 'The time goes into clinics, not firefighting.'")
    
    fix = get_input("\nFix (the alternative): ")
    proof = get_input("Proof (named person + concrete outcome): ")
    forward = get_input("Forward motion (what this makes possible): ")
    
    responses['fix'] = fix
    responses['proof'] = proof
    responses['forward'] = forward
    
    # Generate Caption Skeleton
    print("\n" + "="*60)
    print("CAPTION SKELETON")
    print("="*60 + "\n")
    
    skeleton = f"""{responses['hook']}

{responses['failure']}

{responses['cost']}

{responses['unsustainable']}

{responses['fix']}

{responses['proof']}

{responses['forward']}
"""
    
    print(skeleton)
    
    # Generate Summary
    print("\n" + "="*60)
    print("WORKFLOW SUMMARY")
    print("="*60 + "\n")
    
    print(f"Voice: {responses['voice']}")
    print(f"Format: {responses['format']}")
    print(f"Node: {responses['node_type']} - {responses['node']}")
    print(f"\nHook: {responses['hook']}")
    print(f"Failure: {responses['failure']}")
    print(f"Cost: {responses['cost']}")
    print(f"Unsustainable: {responses['unsustainable']}")
    print(f"Fix: {responses['fix']}")
    print(f"Proof: {responses['proof']}")
    print(f"Forward: {responses['forward']}")
    
    # Checklist
    print("\n" + "="*60)
    print("CHECKLIST")
    print("="*60 + "\n")
    
    checklist = [
        ("Voice clear?", responses['voice'] != ''),
        ("One node picked?", responses['node'] != ''),
        ("First line = number/name/contrast?", any(c.isdigit() or c.isupper() for c in responses['hook'])),
        ("Failure named in concrete terms?", responses['failure'] != ''),
        ("Cost has at least one real number?", any(c.isdigit() for c in responses['cost'])),
        ("Consequence feels inevitable?", any(word in responses['unsustainable'].lower() for word in ['cannot', 'will not', 'fast track', 'cannot'])),
        ("Fix has named proof and forward motion?", responses['proof'] != '' and responses['forward'] != ''),
    ]
    
    for item, checked in checklist:
        status = "✓" if checked else "✗"
        print(f"{status} {item}")
    
    # Save option
    print("\n" + "="*60)
    save = input("Save this skeleton to a file? (y/n): ").strip().lower()
    
    if save == 'y':
        timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
        filename = f"caption-skeleton-{timestamp}.md"
        filepath = Path(filename)
        
        with open(filepath, 'w') as f:
            f.write(f"# Caption Skeleton - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
            f.write(f"**Voice:** {responses['voice']}  \n")
            f.write(f"**Format:** {responses['format']}  \n")
            f.write(f"**Node:** {responses['node_type']} - {responses['node']}\n\n")
            f.write("---\n\n")
            f.write("## Caption\n\n")
            f.write(skeleton)
            f.write("\n---\n\n")
            f.write("## Workflow Summary\n\n")
            for key, value in responses.items():
                f.write(f"- **{key.replace('_', ' ').title()}:** {value}\n")
            f.write("\n---\n\n")
            f.write("## Checklist\n\n")
            for item, checked in checklist:
                status = "✓" if checked else "✗"
                f.write(f"- {status} {item}\n")
        
        print(f"\n✓ Saved to: {filepath.absolute()}")
    
    print("\n" + "="*60)
    print("Done! Refine the skeleton into your final caption.")
    print("="*60 + "\n")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nInterrupted. Exiting.")
        sys.exit(0)
