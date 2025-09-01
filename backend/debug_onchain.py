"""
Debug script to check on-chain score data
Usage: python backend/debug_onchain.py <wallet_address>
"""
import sys
from web3 import Web3
import json
from pathlib import Path

# Load contract info
CONTRACT_ADDRESS = "0x461203d7137FdFA30907288656dBEB0f64408Fb9"
RPC_URL = "https://mainnet.base.org"

# Load ABI
abi_path = Path(__file__).parent / "contracts" / "ScoreCheckerV2_Mainnet.json"
with open(abi_path, 'r') as f:
    contract_data = json.load(f)
    ABI = contract_data['abi']

def check_onchain_score(address: str):
    """Check on-chain score data for a given address"""
    try:
        # Connect to Base Mainnet
        w3 = Web3(Web3.HTTPProvider(RPC_URL))
        print(f"Connected to Base Mainnet: {w3.is_connected()}")
        
        # Get contract instance
        contract = w3.eth.contract(
            address=Web3.to_checksum_address(CONTRACT_ADDRESS),
            abi=ABI
        )
        
        # Convert address to checksum
        user_address = Web3.to_checksum_address(address)
        
        # Get simple score
        print(f"\nChecking score for: {user_address}")
        score_data = contract.functions.getScore(user_address).call()
        print(f"Simple Score: {score_data[0]}, Timestamp: {score_data[1]}")
        
        # Get full score card
        try:
            score_card = contract.functions.getScoreCard(user_address).call()
            print("\nFull Score Card:")
            print(f"  Total Score: {score_card[0]}")
            print(f"  Base Score: {score_card[1]}")
            print(f"  Security Score: {score_card[2]}")
            print(f"  Transactions: {score_card[3]}")
            print(f"  Current Streak: {score_card[4]}")
            print(f"  Max Streak: {score_card[5]}")
            print(f"  Current Balance: {score_card[6] / 1e18:.4f} ETH")
            print(f"  Avg Balance: {score_card[7] / 1e18:.4f} ETH")
            print(f"  Gas Paid: {score_card[8] / 1e18:.4f} ETH")
            print(f"  Suspicious Tokens: {score_card[9]}")
            print(f"  Suspicious Contracts: {score_card[10]}")
            print(f"  Dangerous Interactions: {score_card[11]}")
            print(f"  Suspicious NFTs: {score_card[12]}")
            print(f"  Last Check Time: {score_card[13]}")
            print(f"  Last Issued At: {score_card[14]}")
        except Exception as e:
            print(f"\nNo score card data found: {e}")
        
        # Check if can submit
        can_submit_data = contract.functions.canSubmitScore(user_address).call()
        print(f"\nCan Submit Score: {can_submit_data[0]}")
        if not can_submit_data[0]:
            print(f"Time Remaining: {can_submit_data[1]} seconds")
        
        # Get nonce
        nonce = contract.functions.nonces(user_address).call()
        print(f"Current Nonce: {nonce}")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python debug_onchain.py <wallet_address>")
        sys.exit(1)
    
    address = sys.argv[1]
    check_onchain_score(address)
