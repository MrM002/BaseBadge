#!/usr/bin/env python3
"""
Setup script for BaseBadge
"""

from setuptools import setup, find_packages
import os

# Read the README file
def read_readme():
    with open("README.md", "r", encoding="utf-8") as fh:
        return fh.read()

# Read requirements
def read_requirements():
    with open("backend/requirements.txt", "r", encoding="utf-8") as fh:
        return [line.strip() for line in fh if line.strip() and not line.startswith("#")]

setup(
    name="basebadge",
    version="0.1.0",
    author="0MrM0",
    author_email="contact@basebadge.com",
    description="Your Wallet, Your Reputation – Onchain & Beyond",
    long_description=read_readme(),
    long_description_content_type="text/markdown",
    url="https://github.com/your-username/basebadge",
    project_urls={
        "Bug Reports": "https://github.com/your-username/basebadge/issues",
        "Source": "https://github.com/your-username/basebadge",
        "Documentation": "https://github.com/your-username/basebadge#readme",
    },
    packages=find_packages(),
    classifiers=[
        "Development Status :: 3 - Alpha",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Topic :: Internet :: WWW/HTTP :: HTTP Servers",
        "Topic :: Software Development :: Libraries :: Python Modules",
        "Topic :: System :: Networking :: Monitoring",
    ],
    python_requires=">=3.8",
    install_requires=read_requirements(),
    extras_require={
        "dev": [
            "pytest>=7.0.0",
            "pytest-asyncio>=0.21.0",
            "black>=22.0.0",
            "flake8>=5.0.0",
            "mypy>=1.0.0",
        ],
    },
    entry_points={
        "console_scripts": [
            "basebadge=backend.backend:main",
        ],
    },
    include_package_data=True,
    zip_safe=False,
    keywords="web3, blockchain, reputation, scoring, base, ethereum",
) 